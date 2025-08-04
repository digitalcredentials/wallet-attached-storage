# Wallet Attached Storage Client _(@did.coop/wallet-attached-storage)_

[![Build status](https://img.shields.io/github/actions/workflow/status/did-coop/wallet-attached-storage/main.yml?branch=main)](https://github.com/did-coop/wallet-attached-storage/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM Version](https://img.shields.io/npm/v/@did.coop/wallet-attached-storage.svg)](https://npm.im/@did.coop/wallet-attached-storage)

> A Wallet Attached Storage Javascript/TypeScript client for Node, browser and React Native.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Background

See in progress spec: https://digitalcredentials.github.io/wallet-attached-storage-spec/

### App Identity and Key Management

To use Wallet Attached Storage (to provision data spaces, to create collections,
and to read and write resources), the application or service using this client
will need its own cryptographically provable identity (in the form of a
[DID](https://w3c.github.io/did-core/)).

At minimum, this means that the app or service using this client will need to
create and manage its own public-private key pair. The challenges and security
considerations of cryptographic key management are beyond the scope of this
usage document, but roughly:

* For in browser **client-only Single Page Applications** (SPAs), the app's
  identity is ephemeral -- essentially a key pair will be generated for each
  new user session, and stored in the browser.

* For traditional **server side web applications**, it is recommended that the
  app's DID and key pairs are managed securely, on the server side, preferably
  using an HSM (Hardware Security Module).

* For **mobile apps**, key pairs may be generated during setup, and can take
  advantage of the mobile operating system's keychain and encrypted app storage.

## Security

TBD

## Usage

This client assumes:

* a remote Wallet Attached Storage server is available
* the app is able to create and store a public-private key pair, see the
  [App Identity and Key Management](#app-identity-and-key-management) section
  for more details.

### Creating a `did:key` Signer Instance

Most W.A.S. HTTP operations (creating a space, creating collections, reading and
writing resources) require authorization in the form of zCap invocations via
[HTTP Signatures](https://www.npmjs.com/package/authorization-signature).

The `fetch-client` in these examples automatically constructs the proper http
headers, if you pass it a DID Signer object. A Signer is a minimal abstraction
used to deal with a `did:key` and its associated key pair, with the interface of:

```ts
interface ISigner {
  id: string // Specifically, a did:key key id
  sign: ({ data: Uint8Array }) => Promise<Uint8Array>
}
```

Several DID-related libraries either provide signers directly, or it's fairly
easy to construct them. Some examples:

```ts
import { Ed25519VerificationKey2020 }
  from '@digitalcredentials/ed25519-verification-key-2020' // "^5.0.0-beta.2"

const keyPair = await Ed25519VerificationKey2020.generate()
keyPair.id = `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`

const appDidSigner = keyPair.signer()
```

or:

```ts
import { Ed25519Signer } from '@did.coop/did-key-ed25519' // "^0.0.9"
const appDidSigner = await Ed25519Signer.generate()
```

### Provisioning a New Space

Provision (create) a new space :

```ts
import { StorageClient } from '@wallet.storage/fetch-client' // "^1.1.2"

const url = 'https://data.pub' // load this from config or env variable

const storage = new StorageClient(new URL(url))
const space = storage.space({ signer: appDidSigner })
// Create a new space (sends HTTP API call)
await space.put()

// Save the space.id for later re-use
const spaceId = space.id
```

### Persisting Key Pairs or Signers

Some sample serialization and importing of keys (warning: not recommended for
production use -- this is what HSMs are for).

```ts
// Serialize to JSON for storage

// If using @digitalcredentials/ed25519-verification-key-2020
const exportedKeyPair = await keyPair.export({ publicKey: true, privateKey: true })

// If using @did.coop/did-key-ed25519@0.0.9
const exportedKeyPair = appDidSigner.toJSON()

localStorage.setItem('app-DID', JSON.stringify(exportedKeyPair))

// Load from storage and turn back into a DID Signer
const serializedKeyPair = localStorage.getItem('app-DID')

// If using @digitalcredentials/ed25519-verification-key-2020
const keyPair = await Ed25519VerificationKey2020.from(serializedKeyPair)
const appDidSigner = keyPair.signer()

// If using @did.coop/did-key-ed25519@0.0.9
const appDidSigner = Ed25519Signer.fromJSON(serializedKeyPair)
```

### Connecting to an Existing (provisioned) Space

```ts
import { StorageClient } from '@wallet.storage/fetch-client'

const url = 'https://data.pub' // load this from config or env variable

const storage = new StorageClient(new URL(url))
const space = storage.space({ signer: appDidSigner, id: spaceId })
```

### Creating Resources

Now you can write resources to the space.
Example creating a VC (verifiable credential):

```ts
import { v4 as uuidv4 } from 'uuid';

// Create or load a signer
// Create a spaceId or load an existing spaceId

const space = storage.space({
  signer,
  id: spaceId
});

// Get a reference to a resource path
const resourceUUID = uuidv4();
const resource = space.resource(resourceUUID);
console.log('Resource path:', resource.path);

// Create the credential blob with correct content type
const credentialBlob = new Blob([JSON.stringify(credential)], {
  type: 'application/json'
});
// Issue the HTTP API call to write the resource
const response = await resource.put(credentialBlob, {
  signer
});
console.log('WAS storage response:', {
  status: response.status,
  ok: response.ok
});
if (!response.ok) {
  console.error(
    '[publicLink.ts] Failed to store credential in WAS. Status:',
    response.status
  );
}
```

### Exporting Space contents for Backup

To download / export all the resources in a space (in TARball format):

```ts
// Assuming you have a space object, see above

  const response = await space.get({
    headers: {
      Accept: 'application/x-tar'
    }
  });

  if (!response.ok) throw new Error(`Failed to export space. Status: ${response.status}`);

  const blob = await response.blob?.();
  if (!blob) throw new Error('Failed to get blob from response');

  const fileName = `was-space-${spaceId.split('urn:uuid:')[1]}.tar`;

  // Create a write stream from the blob as appropriate to your platform
```

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2025 DID.coop.
