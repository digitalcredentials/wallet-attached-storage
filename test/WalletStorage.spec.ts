import { expect } from 'chai'
import { WalletStorage } from '../src'

describe('WalletStorage', () => {
  it('has provisionSpace', async () => {
    expect(typeof WalletStorage.provisionSpace).to.equal('function')
  })
})
