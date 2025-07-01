/** @file client that makes requests using fetch + storage HTTP API */

import shapeOfCollectionGetFromJson from './shapes/CollectionGetResponseBody.js'
import type { IStorageClient, IResourceInSpace, IResponse, ISigner, ISpace, ISignedRequestOptions, ErrorResponse } from './types.js'
import { isUrnUuid, parseUrnUuid } from './urn-uuid.js'
import type { UrnUuid } from './urn-uuid.js'
import { createHttpSignatureAuthorization } from 'authorization-signature'
import { ACTIVITYPUB_MEDIA_TYPE } from './activitypub.js'

const defaultIncludeHeaders = [
  '(created)',
  '(expires)',
  '(key-id)',
  '(request-target)',
]

  /**
   * async iterate the items in a remote Storage Collection via fetch
   * @param options - optional arguments
   * @param options.path - Storage path of collection
   * @param options.fetch - Fetch API instance to use to send requests
   * @param options.signer - will sign requests (e.g. with a digital signature algorithm)
   * @yields {{name:string,url:string}} Use this to iterate each item in the collection
   */
  async function* iterateCollectionItems(options: {
    path: `/space/${string}/${string}`
    fetch: typeof globalThis.fetch
    signer?: ISigner
  }) {
  const headers = {}
  const method = 'GET' as const
  const location = options.path
  const signer = options.signer
  const authorization = (signer != null)
    ? await createHttpSignatureAuthorization({
      signer,
      method,
      headers,
      includeHeaders: defaultIncludeHeaders,
      created: new Date(),
      expires: new Date(Date.now() + 30 * 1000),
      url: new URL(
        location,
        // the host will not be used in the authorization
        // unless the options want it to be.
        'https://example.example')
    })
    : undefined
  const requestInit = {
    method,
    headers: {
      accept: ACTIVITYPUB_MEDIA_TYPE,
      ...headers,
      ...(authorization && { authorization })
    }
  }
  const initialCollectionResponse = await options.fetch(options.path, requestInit)
  if (!initialCollectionResponse.ok) {
    switch (initialCollectionResponse.status) {
      case 404:
        throw new Error('failed to iterate collection items because collection not found', {
          cause: initialCollectionResponse
        })
      default:
        throw new Error('failed to iterate collection items because initialCollectionResponse not ok', {
          cause: initialCollectionResponse
        })
    }
  }
  const collectionFromJSON = await initialCollectionResponse.json()
  const initialCollectionSafeParsed = shapeOfCollectionGetFromJson.safeParse(collectionFromJSON)
  if (initialCollectionSafeParsed.error != null) {
    console.debug('invalid collectionFromJSON', collectionFromJSON)
    throw new Error('unexpected collection fetched to start iterateCollectionItems', {
      cause: initialCollectionSafeParsed.error
    })
  }
  const collection = initialCollectionSafeParsed.data
  yield* collection.items
}

export class StorageURLPath {
  #parsed: {
    spacePath: `/space/${string}`
    resourcePath: string
  }

  constructor(path: string) {
    this.#parsed = parsePath(path)
  }

  toString(): `/space/${string}/${string}` {
    return `${this.#parsed.spacePath}/${this.#parsed.resourcePath}` as const
  }
}

/**
 * parse a full Storage URL path for a resource
 * @template SpaceUUID
 * @template ResourcePath
 * @param resource - path to parse
 * @returns parsed the spacePath and resourcePath parsed from full Storage URL path
 * @throws if unable to parse resource path to space path
 * @throws if unable to parse resource path to resource path within space
 */
function parsePath<SpaceUUID extends string, ResourcePath extends string>(resource: `/space/${SpaceUUID}/${ResourcePath}` | string): { spacePath: `/space/${SpaceUUID}`, resourcePath: ResourcePath } {
  const match = resource.match(/(?<spacePath>\/space\/[^/]+)(?<resourcePath>.*)/)
  if (match == null) {
    throw new Error('unable to parse space path from resource path', {
      cause: {
        resource
      }
    })
  }
  const spacePath = match.groups?.spacePath as (undefined | `/space/${SpaceUUID}`)
  if (!spacePath) throw new Error('unable to determine spacePath')
  const resourcePath = match.groups?.resourcePath as (undefined | ResourcePath)
  if (typeof resourcePath !== 'string') {
    throw new Error('unable to parse resourcePath', {
      cause: {
        path: resource
      }
    })
  }
  return { spacePath, resourcePath }
}

class ResourceFetched implements IResourceInSpace {
  type = 'Resource' as const
  #fetch: typeof globalThis.fetch
  path: `/space/${string}/${string}`
  #signer?: ISigner
  constructor(options: {
    path: `/space/${string}/${string}`
    fetch: typeof globalThis.fetch
    signer?: ISigner
  }) {
    this.#fetch = options.fetch
    this.path = options.path
    this.#signer = options.signer
  }

  async get(options: ISignedRequestOptions = {}): Promise<IResponse | ErrorResponse> {
    const headers = options.headers ?? {}
    const method = 'GET' as const
    const location = this.path
    const signer = options.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const response = await this.#fetch(location, {
      method,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    })
    const got: IResponse = {
      status: response.status,
      ok: response.ok,
      async blob() { return await response.clone().blob() },
      async json() { return await response.clone().json() },
      headers: response.headers
    }
    return got
  }

  async post(blob?: Blob, options: {
    signer?: ISigner
  } = {}) {
    const headers = {}
    const method = 'POST' as const
    const location = this.path
    const signer = options.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const response = await this.#fetch(location, {
      method,
      body: blob,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    })
    return {
      ok: response.ok,
      headers: Array.from(response.headers),
      status: response.status,
      async blob() { return await response.clone().blob() },
      async json() { return await response.clone().json() }
    }
  }

  async put(blob?: Blob, options: {
    signer?: ISigner,
    headers?: Record<string, string>
  } = {}) {
    const headers = options.headers ?? {}
    const method = 'PUT' as const
    const location = this.path
    const signer = options.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const response = await this.#fetch(location, {
      method,
      body: blob,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    })
    return {
      ok: response.ok,
      headers: Array.from(response.headers),
      status: response.status,
      async blob() { return await response.clone().blob() },
      async json() { return await response.clone().json() }
    }
  }

  async delete(options: {
    signer?: ISigner,
    headers?: Record<string, string>
  } = {}) {
    const headers = options.headers ?? {}
    const method = 'DELETE' as const
    const location = this.path
    const signer = options.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const response = await this.#fetch(this.path, {
      method,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    })
    return response
  }
}

class SpaceFetched implements ISpace {
  #fetch: typeof globalThis.fetch
  #space: {
    id: UrnUuid
  }

  // #added: Promise<void>
  #signer?: ISigner
  constructor(options: {
    space: string
    fetch: typeof globalThis.fetch
    signer?: ISigner
  }) {
    if (!isUrnUuid(options.space)) {
      throw new Error('expected options.space to be a urn:uuid', {
        cause: {
          space: options.space
        }
      })
    }
    this.#space = {
      id: options.space
    }
    this.#fetch = options.fetch
    this.#signer = options.signer
  }

  // // add this space to the remote repo
  // async #addSpace(options: {
  //   signer?: ISigner,
  //   id: UrnUuid,
  // }) {
  //   const headers = {}
  //   const method = 'POST' as const
  //   const location = `/spaces/`
  //   const signer = options.signer ?? this.#signer
  //   const authorization = signer
  //     ? await createHttpSignatureAuthorization({
  //         signer,
  //         method,
  //         headers,
  //         includeHeaders: defaultIncludeHeaders,
  //         created: new Date,
  //         url: new URL(
  //           location,
  //           // the host will not be used in the authorization
  //           // unless the options want it to be.
  //           'https://example.example'),
  //       })
  //     : undefined
  //   const controller = isDidKeyVerificationMethodId(signer?.id) ? getControllerOfDidKeyVerificationMethod(signer.id) : undefined
  //   const addSpaceResponse = await this.#fetch('/spaces/', {
  //     method: 'POST',
  //     headers: {
  //       'content-type': 'application/json',
  //       ...headers,
  //       ...(authorization && { authorization }),
  //     },
  //     body: JSON.stringify({
  //       id: options.id,
  //       controller,
  //       items: [],
  //       totalItems: 0,
  //     })
  //   })
  //   switch (addSpaceResponse.status) {
  //     case 201: {
  //       // good
  //       break;
  //     }
  //     default:
  //       throw new Error(`POST /spaces/ responded with unexpected status ${addSpaceResponse.status}`, {
  //         cause: { response: addSpaceResponse }
  //       })
  //   }
  // }
  resource(resourcePathParam?: string, options: {
    signer?: ISigner,
    uuid?: UrnUuid
  } = {}) {
    let resourcePath: `/${string}`
    if (typeof resourcePathParam === 'undefined') {
      resourcePath = `/${options.uuid || crypto.randomUUID}` as const
    } else if (typeof resourcePathParam === 'string') {
      if (resourcePathParam.startsWith('/')) {
        resourcePath = resourcePathParam as `/${string}`
      } else {
        resourcePath = `/${resourcePathParam}`
      }
    } else {
      throw new Error('unexpected resource path parameter', { cause: { resourcePathParam } })
    }
    const signer = options.signer ?? this.#signer
    const path = `${this.path}${resourcePath}` as const
    return new ResourceFetched({
      fetch: this.#fetch,
      path,
      signer
    })
  }

  get id() {
    return this.#space.id
  }

  get uuid() {
    return parseUrnUuid(this.id).uuid
  }

  get path() {
    return `/space/${this.uuid}` as const
  }

  // get added() {
  //   return this.#added
  // }
  async get(options: ISignedRequestOptions = {}): Promise<IResponse> {
    const headers = options?.headers ?? {}
    const method = 'GET' as const
    const location = this.path
    const signer = options.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const requestInit = {
      method,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    }
    const response = await this.#fetch(this.path, requestInit)
    const r: IResponse & { status: number } = {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      blob: async () => {
        return await response.clone().blob()
      },
      async json() {
        const text = await response.clone().text()
        return JSON.parse(text)
      }
    }
    return r
  }

  async delete(options: ISignedRequestOptions = {}) {
    const headers = options.headers ?? {}
    const method = 'DELETE' as const
    const location = this.path
    const signer = options.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const requestInit = {
      method,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    }
    const response = await this.#fetch(this.path, requestInit)
    return response
  }

  async post(blob: Blob, options?: ISignedRequestOptions): Promise<IResponse> {
    const headers = options?.headers ?? {}
    const method = 'POST' as const
    const location = this.path
    const signer = options?.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const requestInit = {
      body: blob,
      method,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    }
    console.debug('SpaceFetched#post sending request', this.path, requestInit)
    const response = await this.#fetch(this.path, requestInit)
    return response
  }

  async put(blob?: Blob, options?: ISignedRequestOptions): Promise<IResponse> {
    const headers = options?.headers ?? {}
    const method = 'PUT' as const
    const location = this.path
    const signer = options?.signer ?? this.#signer
    const authorization = (signer != null)
      ? await createHttpSignatureAuthorization({
        signer,
        method,
        headers,
        includeHeaders: defaultIncludeHeaders,
        created: new Date(),
        expires: new Date(Date.now() + 30 * 1000),
        url: new URL(
          location,
          // the host will not be used in the authorization
          // unless the options want it to be.
          'https://example.example')
      })
      : undefined
    const requestInit: RequestInit = {
      body: blob,
      method,
      headers: {
        ...headers,
        ...(authorization && { authorization })
      }
    }
    const response = await this.#fetch(this.path, requestInit)
    const responseClone = response.clone()
    return response
  }
}

type FetchPath = (path: string, init: RequestInit) => Promise<Response>

class StorageFetched implements IStorageClient {
  #fetch: typeof globalThis.fetch
  constructor(options: URL | {
    fetch: typeof globalThis.fetch
  }) {
    if (options instanceof URL) {
      const baseURL = options
      this.#fetch = async function (location: string | URL | Request, init?: RequestInit) {
        if (typeof location === 'string') {
          location = new URL(location, baseURL)
        }
        return await globalThis.fetch(location, init)
      }
    } else {
      this.#fetch = options.fetch
    }
  }

  space(optionsOrId?: Parameters<IStorageClient['space']>[0]) {
    let options: {
      id: UrnUuid
      signer?: ISigner
    }
    let spaceId: UrnUuid
    if (typeof optionsOrId === 'string') {
      spaceId = optionsOrId
      options = {
        id: spaceId
      }
    } else if (typeof optionsOrId === 'object' || !optionsOrId) {
      options = {
        id: optionsOrId?.id || `urn:uuid:${crypto.randomUUID()}` as UrnUuid,
        ...optionsOrId
      }
    } else {
      throw new Error(`unexpected typeof options ${typeof optionsOrId}`)
    }
    return new SpaceFetched({
      fetch: this.#fetch,
      space: options.id,
      signer: options.signer
    })
  }
}

export default StorageFetched
