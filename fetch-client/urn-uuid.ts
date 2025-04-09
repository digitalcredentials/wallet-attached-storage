/** @file helpers for dealing with urn:uuid:… URIs */

export type UrnUuid = `urn:uuid:${string}`

/**
 * type guard to check whether the provided value is a urn:uuid URI
 * @param v - value to test
 * @returns true iff the value is a urn:uuid URI
 */
export function isUrnUuid (v: unknown): v is UrnUuid {
  if (typeof v !== 'string') return false
  if ( ! v.startsWith('urn:uuid:')) return false
  return true
}

/**
 * parse the provided urn:uuid:… URI to get the uuid
 * @param v - urn:uuid to parse
 * @returns parsed components including parsed.uuid
 * @throws if unable to parse uuid from v
 */
export function parseUrnUuid (v: string) {
  const pattern = /urn:uuid:(?<uuid>[^:]+)/
  const match = v.match(pattern)
  const uuid = match?.groups?.uuid
  if ( ! uuid) {
    throw new Error(`unable to parse uuid from ${v}`)
  }
  return {
    uuid,
  }
}
