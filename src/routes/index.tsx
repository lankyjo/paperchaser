import { BuilderWorkspace } from '../components/builder/BuilderWorkspace'
import { ProjectsHome } from '../components/projects/ProjectsHome'
import { FIXTURE_MAP } from '../document/fixtures'
import { PAGE_SIZES, TEMPLATE_REGISTRY } from '../document/tokens'
import type { PageSize, TemplateId } from '../document/types'

const FIXTURE_KEYS = new Set(Object.keys(FIXTURE_MAP))
const TEMPLATE_KEYS = new Set(Object.keys(TEMPLATE_REGISTRY))
const SIZE_KEYS = new Set(Object.keys(PAGE_SIZES))

// Query params are whitelist-checked and never reflected or JSON-parsed; unknown values fall back to defaults.
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

  // Fixtures render read-only for the parity harness; otherwise the projects home opens.
  if (key === null) return <ProjectsHome />
  return <BuilderWorkspace model={FIXTURE_MAP[key]} template={template} pageSize={pageSize} editable={false} />
}
