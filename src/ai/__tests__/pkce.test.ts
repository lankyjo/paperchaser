import { describe, expect, it } from 'vitest'

import { pkceChallenge, pkceVerifier } from '../pkce'

describe('PKCE', () => {
  it('makes a long random verifier and its base64url SHA-256 challenge', async () => {
    const verifier = pkceVerifier()
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/)
    expect(pkceVerifier()).not.toBe(verifier)
    // Expected value computed independently with Node's crypto.createHash('sha256').digest('base64url').
    expect(await pkceChallenge('dBjftJeZ4CVP-mJ92IXwPd2-TFQOd5Cjy6Rwqi3YQ8Q')).toBe('SQXL2y3hTpe16oYMXPSD4hJlDxEWDHL7iFSSVBb6NqQ')
  })
})
