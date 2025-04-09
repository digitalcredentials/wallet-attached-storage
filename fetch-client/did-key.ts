/**
 * @file tools fir dealing with did:key URIs
 * @see https://w3c-ccg.github.io/did-method-key/
 */

/**
 * a DID string
 * @template Method - DID method <https://www.w3.org/TR/did-core/#methods>
 * @see https://www.w3.org/TR/did-core/#did-syntax
 */
export type DID<Method extends string = string> = `did:${Method}:${string}`

/**
 * did:key DIDs resolve to a did document with only a single verificationMethod.
 * this is the type of the id of that verification method.
 * It's usually like `did:key:{publicKeyMultibase}#{publicKeyMultibase}` (where both `{publicKeyMultibase}` are identical).
 */
export type DIDKeyVerificationMethodId = `${DID<'key'>}#${string}`

/**
 * type guard whether the value is a did:key DID string
 * @param s - value to test
 * @returns {boolean} true if s is a did:key
 */
export function isDidKey(s: unknown): s is `did:key:${string}` {
  return Boolean(typeof s === 'string' && s.match(/^did:key:([^:#]+)$/))
}

/**
 * get the controller DID of the provided did:key verificationMethod.
 * For a did:key, it's just a particularly parsed prefix of the provided verificationMethod id.
 * Use this function to do the parsing safely.
 * @param verificationMethod - verificationMethod id to get controller of (which is just a prefix of the verificationMethod id)
 * @returns {DID} controller DID - This is a did:key DID URI and not the URI of the verificationMethod from the DID Document of that DID
 * @throws if verficationMethod id DID is not did:key
 */
export function getControllerOfDidKeyVerificationMethod(verificationMethod: DIDKeyVerificationMethodId) {
  const did = verificationMethod.split('#').at(0)
  if ( ! isDidKey(did)) {
    throw new Error(`unable to determine did:key from did:key verificationMethod id`, {
      cause: {
        verificationMethod
      }
    })
  }
  return did
}
