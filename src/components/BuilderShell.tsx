import type { DocumentModel, PageSize, TemplateId } from '../document/types'
import { BuilderWorkspace } from './builder/BuilderWorkspace'
import { DemoDocument } from './builder/DemoDocument'

// App entry: a fixture model renders read-only for the parity harness, otherwise the stored demo document opens for editing.
export function BuilderShell({
  model: fixtureModel,
  template,
  pageSize,
}: {
  model?: DocumentModel
  template?: TemplateId
  pageSize?: PageSize
}) {
  if (fixtureModel !== undefined) {
    return <BuilderWorkspace model={fixtureModel} template={template} pageSize={pageSize} editable={false} />
  }
  return <DemoDocument pageSize={pageSize} />
}
