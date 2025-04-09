/** @file test ./fetched.ts i.e. storage client that makes requests using fetch + Storage HTTP API */
import { describe, test, mock } from "node:test"
import * as NodeTest from "node:test"
import assert from "node:assert"
import StorageClient from "./fetched.js"
import { createMockFetchForMap, testStorageClient } from "./test-utils.js"
import testPubPutResourceWithSigner from "./tests/testPubPutResourceWithSigner.js"
import testPubDeleteResourceWithSigner from "./tests/testPubDeleteResourceWithSigner.js"
import testPubGetResourceWithSignerCopy from "./tests/testPubGetResourceWithSigner.js"
import testPubSpaceWithSigner from "./tests/testPubSpaceWithSigner.js"
import testPubSetSpaceController from "./tests/testPubSetSpaceController.js"
import { Ed25519Signer } from "@did.coop/did-key-ed25519"

await describe(`@data.pub/client/fetch`, async () => {
  await test(`can testStorageClient`, async t => {
    const mapPathToBlob = new Map<string, Blob>
    const fetch = mock.fn(createMockFetchForMap(mapPathToBlob))
    const pub = new StorageClient({ fetch })
    await testStorageClient(pub)
  })
  await test(`including signer with resource.get sends http signature`, async t => {
    const mapPathToBlob = new Map<string, Blob>
    const fetch = mock.fn(createMockFetchForMap(mapPathToBlob))
    const pub = new StorageClient({ fetch })
    await testPubGetResourceWithSignerCopy(
      pub,
      fetch,
      assert,
      { test: t.test.bind(t) },
    )
  })
  await test(`including signer with resource.put sends http signature`, async t => {
    const mapPathToBlob = new Map<string, Blob>
    const fetch = mock.fn(createMockFetchForMap(mapPathToBlob))
    const pub = new StorageClient({ fetch })
    await testPubPutResourceWithSigner(
      pub,
      fetch,
      assert,
      { test: t.test.bind(t) },
    )
  })
  await test(`including signer with resource.delete sends http signature`, async t => {
    const mapPathToBlob = new Map<string, Blob>
    const fetch = mock.fn(createMockFetchForMap(mapPathToBlob))
    const pub = new StorageClient({ fetch })
    await testPubDeleteResourceWithSigner(
      pub,
      fetch,
      assert,
      { test: t.test.bind(t) },
    )
  })
  await test(`including signer with pub.space uses signer to create space`, async t => {
    const mapPathToBlob = new Map<string, Blob>
    const fetch = mock.fn(createMockFetchForMap(mapPathToBlob))
    const pub = new StorageClient({ fetch })
    const signer = await Ed25519Signer.generate()
    await testPubSpaceWithSigner(
      pub,
      fetch,
      assert,
      signer,
      { test: t.test.bind(t) },
    )
  })
})
