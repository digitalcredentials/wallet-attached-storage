# Wallet Attached Storage Client _(@did-coop/wallet-attached-storage)_

[![Build status](https://img.shields.io/github/actions/workflow/status/did-coop/wallet-attached-storage/main.yml?branch=main)](https://github.com/did-coop/wallet-attached-storage/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM Version](https://img.shields.io/npm/v/@did-coop/wallet-attached-storage.svg)](https://npm.im/@did-coop/wallet-attached-storage)

> A Wallet Attached Storage Javascript/TypeScript client for Node, browser and React Native.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Background

See in progress spec: https://did-coop.github.io/wallet-attached-storage-spec/

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

## Install

- Node.js 18+ is recommended.

### NPM

To install via NPM:

```
npm install @did-coop/wallet-attached-storage
```

### Development

To install locally (for development):

```
git clone https://github.com/did-coop/wallet-attached-storage.git
cd wallet-attached-storage
npm install
```

## Usage

This client assumes:

* a remote Wallet Attached Storage server is available
* the app is able to create and store a public-private key pair, see the
  [App Identity and Key Management](#app-identity-and-key-management) section
  for more details.

Example key pair generation (for an in-browser SPA), for persistence in local
storage.

```ts
import { Ed25519Signer } from '@did.coop/did-key-ed25519'

const appDidSigner = await Ed25519Signer.generate()
```

Example storing and loading:

```ts
// Serialize to JSON for storage
const exportedKeyPair = appDidSigner.toJSON()
localStorage.setItem('app-DID', JSON.stringify(exportedKeyPair))

// Load from storage and turn back into a DID Signer
const loadedKeyPair = localStorage.getItem('app-DID')
const appDidSigner = Ed25519Signer.fromJSON(loadedKeyPair)
```

Create a Wallet Attached Storage Client, connect it to a remote url:

```ts
import { WalletStorage } from '@did-coop/wallet-attached-storage'

const url = 'https://data.pub' // load this from config

let storage
try {
  storage = WalletStorage.connect({ url, signer: appDidSigner })
} catch (e) {
  console.error('Error connecting:', e)
  throw e
}
```

Now you can read and write resources to and from collections:

```ts
// Create a reference to the Credentials collection (note that no API calls are
//   made yet)
const credentials = storage.collection('credentials')

// Iterate through the collection, fetch the resources
for await (const resource of credentials) {
  const response = await resource.get()
  const vc = await response.json()
  console.log(JSON.stringify(vc, null, 2))
}

// Upload a VC
await credentials.resource().put(
  new Blob(JSON.stringify(vc), { type: 'application/vc' })
)

// Upload Evidence / Documents
await storage.collection('documents')
  .resource().put(getDocumentBlob())
```

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2025 DID.coop.
