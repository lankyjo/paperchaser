import type { Branding, DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { BlockId } from '../OutlinePane'

// Document-level settings (template, page size, branding, logo, block visibility), all committed to history.
export function useDocumentSettings(model: DocumentModel, commit: (next: DocumentModel) => void) {
  const changeTemplate = (template: TemplateId) => commit({ ...model, template })
  const changeBranding = (branding: Partial<Branding> | undefined) => {
    const next = { ...model }
    if (branding === undefined) delete next.branding
    else next.branding = branding
    commit(next)
  }
  const changeLogo = (logo: string | null) => commit({ ...model, company: { ...model.company, logo } })
  const changePageSize = (pageSize: PageSize) => commit({ ...model, pageSize })
  const toggleVisibility = (blockId: BlockId, visible: boolean) => {
    const current = model.settings?.blockVisibility ?? {}
    commit({ ...model, settings: { ...model.settings, blockVisibility: { ...current, [blockId]: visible } } })
  }

  return {
    template: model.template,
    pageSize: model.pageSize ?? 'a4',
    changeTemplate,
    changeBranding,
    changeLogo,
    changePageSize,
    toggleVisibility,
  }
}
