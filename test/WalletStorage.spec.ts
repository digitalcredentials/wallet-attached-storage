import { expect } from 'chai'
import { WalletStorage } from '../src'

describe('WalletStorage', () => {
  it('calls function', async () => {
    const ex = new WalletStorage()
    expect(ex.hello()).to.equal('world')
  })
})
