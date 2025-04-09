#!/usr/bin/env node --import tsx

/** @file script to PUT a resource in a space */

import { StorageClient } from "../index.js"
import { parseArgs } from "node:util"
import { isUrnUuid } from "../urn-uuid.js";
import type { UrnUuid } from "../urn-uuid.ts";
import { existsSync, openAsBlob } from "node:fs";

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
    resource: {
      type: 'string',
      short: 'r',
    },
    file: {
      type: 'string',
      short: 'f',
    },
  },
});

// determine spaceId
let spaceId: UrnUuid
if (values.space) {
  if (isUrnUuid(values.space)) {
    spaceId = values.space
  } else {
    throw new Error(`--space option must be a valid urn:uuid:{uuid}`)
  }
} else {
  throw new Error(`unable to determine space id`)
}

// determine file to upload
let filePath: string | undefined
if (values.file) {
  if (existsSync(values.file)) {
    filePath = values.file
  } else {
    throw new Error(`file does not exist ${values.file}`)
  }
}
if (typeof filePath === "undefined") {
  throw new Error(`pass a file to upload as --file <file>`)
}

const fileBlob = await openAsBlob(filePath)

const pub = new StorageClient(new URL(values.url))
const space = pub.space(spaceId)
const resource = space.resource(values.resource)

await resource.put(fileBlob)

console.warn(`put resource`, new URL(resource.path, values.url).toString())
