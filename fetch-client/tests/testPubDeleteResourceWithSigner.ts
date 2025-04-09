/** @file test an IPub to ensure it can delete resources */

import type * as NodeTest from "node:test"
import { IStorageClient as IPub } from "../types.js"
import { Ed25519Signer } from "@did.coop/did-key-ed25519"
import type nodeAssert from "node:assert";

/**
 * test an IPub to ensure it can delete resources
 * @param pub - pub to test
 * @param fetch - Fetch API implementation
 * @param assert - assertion library
 * @param testing - testing library
 * @param testing.test - add a test
 */
export default async function (
  pub: IPub,
  fetch: NodeTest.Mock<typeof globalThis.fetch>,
  assert: typeof nodeAssert,
  testing: {
    test: typeof NodeTest['test'],
  },
) {
  const { test } = testing;
  await test('can delete a resource with an http signature', async (t) => {
    const signer = await Ed25519Signer.generate()
    const resource = pub.space().resource()
    await resource.delete({ signer })

    const fetchCallToRequestPutResource = fetch.mock.calls.find(
      call => call.arguments[1]?.method === 'DELETE' && call.arguments[0].toString().startsWith('/space/'))
    // we expect the call to have included an 'authorization' request header
    // with an http signature
    const headersForPut = fetchCallToRequestPutResource?.arguments[1]?.headers
    assert.ok(typeof headersForPut === 'object', `fetch call to DELETE resource includes headers`)
    const authorizationHeader = new Headers(headersForPut).get('authorization')
    assert.ok(authorizationHeader, `fetch call to DELETE resource includes headers.authorization`)
    assert.ok(authorizationHeader.startsWith(`Signature keyId="${signer.id}"`), `authorization header value starts with Signature`)
  })
}
