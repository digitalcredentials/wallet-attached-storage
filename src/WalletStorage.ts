/*!
 * Copyright (c) 2025 DID.coop. All rights reserved.
 */
import { DataPubFetchClient } from '@data.pub/fetch-client'
import { ISpace } from '@data.pub/fetch-client/lib/types'

export interface ISigner {
  id?: string
  sign: (signable: { data: Uint8Array }) => Promise<Uint8Array>
}

export class WalletStorage {
  // static connect ({ url, signer }: { url: string, signer: ISigner }): ? {
  // }

  /**
   * Provisions an ephemeral Wallet Attached Storage space (for use by an
   * application, to receive zcaps etc).
   *
   * @param url {string} - URL to a DataPub server.
   * @param signer {ISigner} - Ed25519 did:key Signer.
   */
  static async provisionSpace (
    { url, signer }: { url: string | URL, signer: ISigner }
  ): Promise<ISpace> {
    const pub = new DataPubFetchClient(new URL(url))

    const space = pub.space({ signer })
    // Create a new space
    const spaceResponse = await space.put()

  }
}
