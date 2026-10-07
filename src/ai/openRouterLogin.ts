import { keyStore } from '../db/keyStore'
import { pkceChallenge, pkceVerifier } from './pkce'

const VERIFIER_KEY = 'openrouterVerifier'

// Sends the user to OpenRouter to approve a key for Paperchaser; they come back to Settings with a one-time code.
export async function startOpenRouterLogin() {
  const verifier = pkceVerifier()
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const callback = `${window.location.origin}/settings`
  const params = new URLSearchParams({ callback_url: callback, code_challenge: await pkceChallenge(verifier), code_challenge_method: 'S256' })
  window.location.assign(`https://openrouter.ai/auth?${params}`)
}

// Exchanges the returned code for a key and remembers it in the separate key store.
export async function finishOpenRouterLogin(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) throw new Error('The OpenRouter sign-in expired. Please try again.')
  const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: 'S256' }),
  })
  if (!response.ok) throw new Error('OpenRouter did not accept the sign-in. Please try again.')
  const { key } = (await response.json()) as { key: string }
  sessionStorage.removeItem(VERIFIER_KEY)
  await keyStore.set('openrouter', key, { remember: true })
}
