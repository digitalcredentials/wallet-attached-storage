/** @file test an IPub to ensure it can interact with a space */

import type * as NodeTest from "node:test"
import { IStorageClient as IPub, ISigner } from "../types.js"
import { Ed25519Signer } from "@did.coop/did-key-ed25519"
import type nodeAssert from "node:assert";

/**
 * test an IPub to ensure it can interact with a space
 * @param pub - pub to test
 * @param fetch - Fetch API implementation
 * @param assert - assertion library
 * @param signer - creates signature for datapub requests
 * @param testing - testing library
 * @param testing.test - add a test
 */
export default async function (
  pub: IPub,
  fetch: NodeTest.Mock<typeof globalThis.fetch>,
  assert: typeof nodeAssert,
  signer: ISigner,
  testing: {
    test: typeof NodeTest['test'],
  },
) {
  const { test } = testing;
  await test('can put a resource with an http signature', async (t) => {
    const space = pub.space({signer})
    const resource = space.resource()
    await resource.put(new Blob(['hi'],{type:'text/plain'}), { signer })

    const headersFromCcall = new Headers(fetch.mock.calls[0].arguments[1]?.headers)
    assert.ok(headersFromCcall.get('authorization')?.startsWith(`Signature keyId="${signer.id}"`))
  })

  await test('can put a space with an http signature', async t => {
    const space = pub.space({signer})
    const spaceObject = {
      controller: signer.id,
    }
    const responseToPut = await space.put(
      new Blob([JSON.stringify(spaceObject)],{type:'application/json'}),
      { signer })
    assert.ok(responseToPut.ok)

    const headersFromCcall = new Headers(fetch.mock.calls[0].arguments[1]?.headers)
    assert.ok(headersFromCcall.get('authorization')?.startsWith(`Signature keyId="${signer.id}"`))

    // then should be able to get the space
    const responseToGetSpace = await space.get()
    assert.ok(responseToGetSpace.ok)
    const spaceFromResponse = await responseToGetSpace.json?.()
    assert.equal(
      (spaceFromResponse as typeof spaceObject).controller,
      spaceObject.controller,
      'space from response to GEt should have same controller as spaceObject previously PUT'
    )
  })
}
