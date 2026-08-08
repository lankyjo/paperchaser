import { RenderBench } from '../components/RenderBench'
import { FIXTURE_MAP } from '../document/fixtures'

const FIXTURE_KEYS = new Set(Object.keys(FIXTURE_MAP))

/**
 * Bench entry route. The ?fixture= param stays whitelist-validated against
 * FIXTURE_MAP keys (threat T-01-01) for the parity harness: a whitelisted key
 * renders that fixture through the bench; any other value (or no param at all)
 * falls through to the empty-store demo path (D-11) — raw query strings are
 * never reflected into the DOM and never JSON-parsed.
 */
export function IndexPage() {
  const raw = new URLSearchParams(window.location.search).get('fixture')
  const key = raw !== null && FIXTURE_KEYS.has(raw) ? raw : null
  return <RenderBench model={key !== null ? FIXTURE_MAP[key] : undefined} />
}
