#!/usr/bin/env node --import tsx

/**
 * @file script that illustrates how to create a Space
 */

import { parseArgs } from "node:util"
import { StorageClient } from "../index.js"
import { ISigner, UrnUuid } from "../types.js"
import { createReadStream, existsSync, readFileSync } from "node:fs"
import { SshpkSigner } from "@data.pub/did-sshpk"
import sshpk from "sshpk"
import { DIDKeyVerificationMethodId, getControllerOfDidKeyVerificationMethod } from "../did-key.js"

const parsedArgs = parseArgs({
  options: {
    help: {
      type: 'boolean',
      short: 'h',
    },
    'dry-run': {
      type: 'boolean',
    },
    identity: {
      type: 'string',
      short: 'i',
    },
    'set-controller': {
      type: 'boolean',
    },
    uuid: {
      type: 'string',
    },
    verbose: {
      type: 'boolean',
      short: 'v',
    }
  }
})


const helpString = `
# create-space.ts

Usage:

  ./create-space.ts --identity ~/.ssh/id_ed25519
`

if (parsedArgs.values.help) {
  console.debug(helpString)
}

let signer: ISigner|undefined
if (parsedArgs.values.identity) {
  if (existsSync(parsedArgs.values.identity)) {
    // identity is path to key file
    const identityFileName = parsedArgs.values.identity
    const identityFileBuffer = readFileSync(identityFileName)
    const identityFilePrivateKey = sshpk.parsePrivateKey(identityFileBuffer)
    const sshSigner = await SshpkSigner.fromPrivateKey(identityFilePrivateKey)
    signer = sshSigner
  }
}

const pub = new StorageClient(new URL(`https://data.pub`),)
const space = pub.space({ signer })

let spaceObject
if (parsedArgs.values['set-controller']) {
  spaceObject = (spaceObject ?? {})  as { controller?: string }
  spaceObject.controller = signer?.id ? getControllerOfDidKeyVerificationMethod(signer.id as DIDKeyVerificationMethodId) : undefined
}
if (parsedArgs.values['uuid']) {
  spaceObject = (spaceObject ?? {})  as { id?: UrnUuid }
  spaceObject.id = `urn:uuid:${parsedArgs.values.uuid}`
}

if (parsedArgs.values.verbose) {
  console.debug('space object that will be sent', spaceObject)
}

const spaceBlob = spaceObject ? new Blob([JSON.stringify(spaceObject)],{type:'application/json'}) : undefined
const responseToPut = await space.put(spaceBlob)

console.debug(JSON.stringify(responseToPut, null, 2))
