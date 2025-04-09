/** @file ActivityPub-related stuff */

export const ACTIVITYPUB_MEDIA_TYPE = `application/ld+json; profile="https://www.w3.org/ns/activitystreams"`

// sometimes this gets here without a space after the first semicolon.
// I'm not sure where it comes from yet, so allowing it for now. @todo
export const ACTIVITYPUB_MEDIA_TYPE_SANS_WHITESPACE = 'application/ld+json;profile="https://www.w3.org/ns/activitystreams"' as const

// https://www.w3.org/TR/activitypub/#public-addressing
export const ACTIVITYPUB_PUBLIC_ADDRESS = 'https://www.w3.org/ns/activitystreams#Public' as const

export const ACTIVITYPUB_ADDRESSING_PROPERTIES = new Set(['to','bto','cc','bcc'])

/**
 * return whether t is a known activitypub media type
 * @param t - media type to check
 * @returns - whether the provided string is
 * a known ActivityPub media type
 */
export function isValidActivityPubMediaType(t: string) {
  switch (t) {
    case ACTIVITYPUB_MEDIA_TYPE:
    case ACTIVITYPUB_MEDIA_TYPE_SANS_WHITESPACE:
      return true
  }
  return false
}
