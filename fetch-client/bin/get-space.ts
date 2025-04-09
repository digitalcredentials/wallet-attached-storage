#!/usr/bin/env node --import tsx

/** @file script to get a resource in a space */

import { StorageClient } from "../index.js"
import { parseArgs } from "node:util"
import { isUrnUuid } from "../urn-uuid.js";
import type { UrnUuid } from "../urn-uuid.ts";

const DEFAULT_URL = `https://data.pub`

const {
  values,
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    url: {
      type: 'string',
      default: DEFAULT_URL
    },
    space: {
      type: 'string',
      short: 's',
    },
  },
});

// determine spaceId
let spaceId: UrnUuid
if (positionals.length === 1 && isUrnUuid(positionals[0])) {
  // if first arg is a urn:uuid, it's a space id
  const firstArg = positionals[0]
  if (isUrnUuid(firstArg)) {
    spaceId = firstArg
    positionals.shift()
  } else {
    throw new Error(`first argument must be a valid urn:uuid:{uuid}`)
  }
} else if (values.space) {
  if (isUrnUuid(values.space)) {
    spaceId = values.space
  } else {
    throw new Error(`--space option must be a valid urn:uuid:{uuid}`)
  }
} else {
  throw new Error(`unable to determine space id`)
}

const pub = new StorageClient(new URL(values.url))
const space = pub.space(spaceId)
const spaceFromGet = await space.get().then(r => r.json?.())

console.debug(spaceFromGet)
