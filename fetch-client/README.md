# @data.pub/fetch-cient

interact with a [DataPub][] server via [`fetch`](https://fetch.spec.whatwg.org/#fetch-method).

## Usage

### with JavaScript

```typescript
import { DataPubFetchClient } from "@data.pub/fetch-client";
import { Ed25519Signer } from "@did.coop/did-key-ed25519"

const datapub = new DataPubFetchClient(new URL('https://data.pub'))

// This signer can create cryptographic signatures
const signer = await Ed25519Signer.generate()

// create the space with signer so all requests get signed by it
const space = datapub.space({ signer })
```

#### Space PUT

```typescript
// we want to make sure the space has a controller.
// wel'll do so by sending PUT w/ a representation of the space
// with a controller property
const spaceObject = {
  controller: signer.id,
}
const spaceObjectBlob = new Blob(
  [JSON.stringify(spaceObject)],
  {type:'application/json'},
)

// send PUT request to update the space
const responseToPutSpace = await space.put(spaceObjectBlob)
console.debug({ responseToPutSpace })
```

#### Space GET

```typescript
// GET space
const responseToGetSpace = await space.get()
console.debug({ responseToGetSpace })
```

#### Resource PUT
```typescript

// PUT resource
await space.resource('foo').put(new Blob(['foo']))

// requests with no signer should now be disallowed
const responseToGetWithoutSigner = await datapub.space({ id: space.id }).resource('foo').get()
console.debug({responseToGetWithoutSigner})
```

#### Resource GET

```typescript
// GET resource
const responseToGetResource = await space.resource('foo').get()
console.debug({responseToGetResource})
```

### byexample

These snippets should pass [byexample](https://byexamples.github.io/byexample/languages/javascript)

> byexample -l javascript README.md

```javascript
> const { Ed25519Signer } = await import("@did.coop/did-key-ed25519")
> const { DataPubFetchClient } = await import("@data.pub/fetch-client");
> const { createMockFetchForMap } = await import("@data.pub/fetch-client/test-utils");
> const signer = Ed25519Signer.generate()
> const storage = new Map
> const fetch = createMockFetchForMap(storage) // byexample: +timeout=100
> const pub = new DataPubFetchClient({ fetch, signer })
> const space = pub.space()
> const resource = space.resource()

// store a message
> const message = new Blob(['hi'],{type:'text/plain'})
> await resource.put(message)

// retrieve a message
> const messageFromGet = await resource.get().then(r => r.blob())
> const messageText = await messageFromGet.text()
> messageText
'hi'
```

[DataPub]: https://data.pub
