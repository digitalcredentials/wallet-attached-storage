/** @file helpers for testing in this package */
import assert from "node:assert"
import { IStorageClient } from "./types.js"
import { isUrnUuid, parseUrnUuid } from "./urn-uuid.js"
import { isValidActivityPubMediaType } from "./activitypub.js"

/**
 * perform generic testing on the provided pub
 * @param pub - pub to test
 */
export async function testStorageClient(pub: IStorageClient, uuid?: string) {
  const space = pub.space()
  const resource = space.resource()

  // store a message
  const nonce = uuid || crypto.randomUUID()
  const message = new Blob([nonce],{type:'text/plain'})
  await resource.put(message)

  // retrieve the message
  const messageFromGet = await resource.get()
  assert.ok(messageFromGet.ok)
  assert.equal(await messageFromGet.blob?.().then(b => b.text()), nonce)

  // check for authorization
  const gotAuthorization = new Headers(Array.from(messageFromGet.headers)).get('authorization')
  if (gotAuthorization) {
    assert.ok(gotAuthorization.startsWith(`Signature keyId="did:key:`), `authorization is HTTP Signature w/ did:key`)
  }
}

/**
 * given a map of path to blob, return a AS2-style Collection describing the contents
 * @param mapPathToBlob - map of space to look for collection
 * @param collectionPath - resource path of collection within space
 * @returns collection representation of referent of collectionPath
 */
function getCollectionFromMap(mapPathToBlob: Map<string,Blob>, collectionPath: string) {
  let totalItems = 0
  const items: Array<{ name: string, url: string }> = []
  for (const [k,v] of mapPathToBlob) {
    if (k.startsWith(collectionPath) && k !== collectionPath) {
      totalItems++
      const name = k.replace(collectionPath, '')
      items.push({
        name,
        url: collectionPath,
      })
    }
  }
  const modifiedCollection = {
    totalItems,
    items,
  }
  return modifiedCollection
}

/**
 * use node:test mock to create a mocked Fetch API instance that can be used to
 * test Storage client HTTP requests without actually hitting the network.
 * Instead, the data is read/write to/from a Map
 * @param mapPathToBlob - map to use to read/write data
 * @returns mocked fetch
 */
export function createMockFetchForMap(mapPathToBlob: Map<string,Blob>): typeof fetch {
  return async (location: string|URL|Request, init?: RequestInit) => {
    // console.debug('mock fetch', init?.method ?? 'GET', location.toString())
    if (typeof location === 'string') {
      location = new URL(location, 'http://example.example')
    }
    const request = new Request(location, init)
    const pathname = new URL(request.url).pathname

    // handle /space/:id
    const spaceByUuidRouteMatch = pathname.match(/^\/space\/(?<uuid>[^/]+)$/)
    if (spaceByUuidRouteMatch) {
      const { uuid } = spaceByUuidRouteMatch.groups || {}
      switch (request.method) {
        case "PUT":
        case "POST": {
          // POST/PUT to space are same and should patch
          const requestBlob = await request.blob()
          mapPathToBlob.set(pathname, requestBlob)
          return new Response(null, {
            status: 204,
          })
        }
      }
    }

    switch (request.method) {
      case "GET": {
        let blobForGet = mapPathToBlob.get(pathname)
        if ( ! blobForGet) {
          return new Response(null, { status: 404 })
        }
        // if it's ActivityPub, it might be a collection,
        // and need dynamic modifications
        if (isValidActivityPubMediaType(blobForGet.type)) {
          const parsedFromJson = JSON.parse(await blobForGet.text())
          if (parsedFromJson.type === 'Collection') {
            const modifiedCollection = {
              ...(parsedFromJson),
              ...getCollectionFromMap(mapPathToBlob, pathname),
            }
            blobForGet = new Blob([JSON.stringify(modifiedCollection)], { type: blobForGet.type })
          }
        }
        const response = new Response(blobForGet)
        return response
      }
      case "DELETE": {
        mapPathToBlob.delete(pathname);
        return new Response(null, {
          status: 204,
        })
      }
      case "PUT": {
        const requestBlob = await request.blob()
        if (!requestBlob.type) {
          throw new Error('putting untyped blob', {
            cause: {requestBlob}
          })
        }
        mapPathToBlob.set(pathname, requestBlob)
        return new Response(null, {
          status: 204,
        })
      }
      case "POST":
        if (new URL(request.url).pathname === '/spaces/') {
          // create a space
          const space = await request.json()
          if (!(space && typeof space === "object" && 'id' in space && isUrnUuid(space.id))) {
            throw new Error(`unable to determine space id`)
          }
          const pathForSpace = `/spaces/${parseUrnUuid(space.id).uuid}`
          mapPathToBlob.set(pathForSpace, new Blob([JSON.stringify(space)], { type: 'application/json' }))
        }
        return new Response(null, { status: 201 })
    }
    throw new Error('unexpected request method ' + request.method)
  }
}
