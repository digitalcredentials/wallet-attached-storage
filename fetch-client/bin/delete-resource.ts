#!/usr/bin/env node --import tsx

/** @file script to delete a resource in a space */

import { StorageClient } from "../index.js"
import { parseArgs } from "node:util"
import { isUrnUuid } from "../urn-uuid.js";
import type { UrnUuid } from "../urn-uuid.ts";

const DEFAULT_URL = `https://data.pub`

const {
  values,
  positionals,
  tokens,
} = parseArgs({
  allowPositionals: true,
  tokens: true,
  options: {
    url: {
      type: 'string',
      default: DEFAULT_URL
    },
    space: {
      type: 'string',
      short: 's',
    },
    resource: {
      type: 'string',
      short: 'r',
    },
  },
});

let spaceId: UrnUuid | undefined
const storageServerURL: URL | undefined = values.url ? new URL(values.url) : undefined

for (const token of tokens) {
  switch (token.kind) {
    case "option":
      switch (token.name) {
        case "space": {
          // ensure it is a urn uuid
          if (isUrnUuid(token.value)) {
            spaceId = token.value
          } else {
            throw new Error(`--space option value must be a urn:uuid:{uuid}`)
          }
          break;
        }
      }
      break;
  }
}

if (!spaceId) {
  throw new Error(`unable to determine space id`)
}
if (!storageServerURL) {
  throw new Error(`unable to determine storageServerURL`)
}

const pub = new StorageClient(storageServerURL)
const space = pub.space(spaceId)
const resource = space.resource(values.resource)

try {
  await resource.delete()
  console.warn(`deleted resource`, new URL(resource.path, values.url).toString())
} catch (error) {
  throw new Error(`error deleting resource`, {
    cause: error,
  })
}
