import { expect } from 'chai'
import { WasClient } from '../src'

describe('WasClient', () => {
  it('calls function', async () => {
    const ex = new WasClient()
    expect(ex.hello()).to.equal('world')
  })
})
