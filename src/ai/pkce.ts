const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')

// A one-time secret kept in the browser while the user signs in with OpenRouter.
export const pkceVerifier = () => base64url(crypto.getRandomValues(new Uint8Array(48)))

// The verifier's SHA-256, sent with the login so OpenRouter can check the later key exchange.
export async function pkceChallenge(verifier: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
}
