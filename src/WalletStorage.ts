/*!
 * Copyright (c) 2025 DID.coop. All rights reserved.
 */
import { StorageClient } from '@wallet.storage/fetch-client'
import { ISigner, ISpace, UrnUuid } from '@wallet.storage/fetch-client/types'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class WalletStorage {
  // static connect ({ url, signer }: { url: string, signer: ISigner }): ? {
  // }

  /**
   * Provisions an ephemeral Wallet Attached Storage space (for use by an
   * application, to receive zcaps etc).
   *
   * @param url {string} - URL to a Storage server.
   * @param signer {ISigner} - Ed25519 did:key Signer.
   */
  static async provisionSpace (
    { url, signer, id }: { url: string | URL, signer: ISigner, id?: UrnUuid }
  ): Promise<ISpace> {
    const storage = new StorageClient(new URL(url))
    const space = storage.space({ signer, id })
    // Create a new space (sends HTTP API call)
    await space.put()
    return space
  }
}
