import { describe, expect, it } from 'vitest'

import { sha256Hex } from '../sha256Hex'

describe('sha256Hex', () => {
  it('hashes text to lowercase hex so equal images get equal ids', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
