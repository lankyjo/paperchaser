import { DocumentPage } from '../components/DocumentPage'
import { FIXTURE_MAP } from '../document/fixtures'

const FIXTURE_KEYS = new Set(Object.keys(FIXTURE_MAP))

const DEFAULT_FIXTURE = 'invoice-simple'

/**
 * Spike entry route. Reads ?fixture= and whitelist-validates it against
 * FIXTURE_MAP keys (threat T-01-01): unknown or missing keys fall back to
 * invoice-simple. Raw query strings are never reflected into the DOM and never
 * JSON-parsed (RESEARCH Security Domain).
 */
export function IndexPage() {
  const raw = new URLSearchParams(window.location.search).get('fixture')
  const key = raw !== null && FIXTURE_KEYS.has(raw) ? raw : DEFAULT_FIXTURE
  return <DocumentPage model={FIXTURE_MAP[key]} />
}
