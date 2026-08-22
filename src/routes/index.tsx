import { BuilderShell } from '../components/BuilderShell'
import { FIXTURE_MAP } from '../document/fixtures'
import { PAGE_SIZES, TEMPLATE_REGISTRY } from '../document/tokens'
import type { PageSize, TemplateId } from '../document/types'

const FIXTURE_KEYS = new Set(Object.keys(FIXTURE_MAP))
const TEMPLATE_KEYS = new Set(Object.keys(TEMPLATE_REGISTRY))
const SIZE_KEYS = new Set(Object.keys(PAGE_SIZES))

/**
 * Bench entry route. Every query param is whitelist-validated before use —
 * raw query strings are never reflected into the DOM and never JSON-parsed
 * (threat T-01-01, extended to V5):
 * - ?fixture= (T-01-01): whitelisted FIXTURE_MAP keys render that fixture
 *   through the bench for the parity harness; any other value (or no param)
 *   falls through to the empty-store demo path (D-11).
 * - ?template= (V5): checked against TEMPLATE_REGISTRY keys; unknown → undefined
 *   → resolver default 'minimal' (D-09). Never an error page.
 * - ?size= (V5): checked against PAGE_SIZES keys; unknown → undefined → 'a4'
 *   (PDF-01). Never an error page.
 */
export function IndexPage() {
  const params = new URLSearchParams(window.location.search)

  const raw = params.get('fixture')
  const key = raw !== null && FIXTURE_KEYS.has(raw) ? raw : null

  const rawTemplate = params.get('template')
  const template: TemplateId | undefined =
    rawTemplate !== null && TEMPLATE_KEYS.has(rawTemplate) ? (rawTemplate as TemplateId) : undefined

  const rawSize = params.get('size')
  const pageSize: PageSize | undefined =
    rawSize !== null && SIZE_KEYS.has(rawSize) ? (rawSize as PageSize) : undefined

  return (
    <BuilderShell model={key !== null ? FIXTURE_MAP[key] : undefined} template={template} pageSize={pageSize} />
  )
}
