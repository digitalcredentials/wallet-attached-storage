#!/usr/bin/env node --import tsx

/** @file test how to use a client to set space controller */

import * as NodeTest from "node:test"
import type { IStorageClient, UrnUuid } from "../types.js"
import type nodeAssert from "assert"

import { Ed25519Signer } from "@did.coop/did-key-ed25519"
import { getControllerOfDidKeyVerificationMethod } from "../did-key.js"
import { fileURLToPath } from "url"
import { StorageClient } from "../index.js"
import assert from "assert"
import { v4 as uuidv4 } from "uuid"

/**
 * test a StorageClient to ensure it can update spaces
 * @param pub - pub to test
 * @param assert - assertion library
 * @param testing - testing library
 * @param testing.test - add a test
 */
export default async function testSetSpaceController(
  pub: IStorageClient,
  assert: typeof nodeAssert,
  testing: Pick<typeof NodeTest,'test'>
) {
  const { test } = testing;
  await test('can put a resource with an http signature', async (t) => {

  /*
   General strategy:
   * create space b
   * put resource in space b. It should not require auth if there is no space controller.
   * generate key c
   * update space controller to key c by sending PUT request with body {controller:keyC}
   * try to put resource in space b with keyC. it should succeed
   * try to put resource in space b with no auth. it should fail
   * put resource in space b as key c. it shoould succeed.
  */
   {
    // create space b
    const spaceBUuid = uuidv4()
    const spaceBObject = {
      id: `urn:uuid:${spaceBUuid}` as UrnUuid,
    }

    // create local space client
    const keyB = await Ed25519Signer.generate()
    const space = pub.space({ id: spaceBObject.id, signer: keyB })

    // ensure server is aware of space by PUTting a JSON representation
    const spaceBBlob = new Blob([JSON.stringify(spaceBObject)],{type:'application/json'})
    const responseToPutSpace = await space.put(spaceBBlob)
    assert.equal(responseToPutSpace.status, 204)
    assert.equal(responseToPutSpace.ok, true)

    // generate key c
    const keyC = await Ed25519Signer.generate()

    // update space controller to key c by sending PUT request with body {controller:keyC}
    const spaceBObject2 = {
      ...spaceBObject,
      controller: getControllerOfDidKeyVerificationMethod(keyC.id),
    }
    const spaceBObject2Blob = new Blob([JSON.stringify(spaceBObject2)],{type:'application/json'})
    const responseToPutSpace2 = await space.put(spaceBObject2Blob)
    assert.equal(responseToPutSpace2.status, 204)
    assert.equal(responseToPutSpace2.ok, true)

    // try to put resource in space b with keyC. it should succeed
    const responseToPutWithKeyC = await pub.space({ id: space.id, signer: keyC }).resource('putWithKeyC').put(new Blob(['putWithKeyC'],{type:'text/plain'}))
    assert.equal(responseToPutWithKeyC.status, 204)

    // try to put resource in space b with no auth. it should fail
    const responseToPutSansAuth = await pub.space({ id: space.id }).resource('putSansAuth').put(new Blob(['putSansAuth'],{type:'text/plain'}))
    assert.equal(responseToPutSansAuth.status, 401, `response status must be 401 attempting to PUT resource without auth in a space with a controller`)
  }
  })
}

const isMain = () => {
  return fileURLToPath(import.meta.url) === process.argv[1]
}

if (isMain()) {
  const storageUrlString = process.argv[2] ?? process.env.STORAGE_URL ?? 'https://data.pub'
  await NodeTest.test(`can use fetch-client to set space controller at ${storageUrlString}`, async t => {
    const pub = new StorageClient(new URL(storageUrlString))
    await testSetSpaceController(
      pub,
      assert,
      NodeTest,
    )
  })
}
