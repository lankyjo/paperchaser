import { useState } from 'react'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { BlockId } from '../OutlinePane'

// Document-level settings (template, page size, branding, logo, currency, block visibility), all committed to history.
export function useDocumentSettings(
  model: DocumentModel,
  commit: (next: DocumentModel) => void,
  initialTemplate?: TemplateId,
  initialPageSize?: PageSize,
) {
  const [currentTemplate, setCurrentTemplate] = useState<TemplateId | undefined>(initialTemplate ?? model.template)
  const [currentPageSize, setCurrentPageSize] = useState<PageSize>(initialPageSize ?? model.pageSize ?? 'a4')

  const changeTemplate = (template: TemplateId) => {
    setCurrentTemplate(template)
    commit({ ...model, template })
  }
  const changeBranding = (branding: Partial<Branding> | undefined) => {
    const next = { ...model }
    if (branding === undefined) delete next.branding
    else next.branding = branding
    commit(next)
  }
  const changeLogo = (logo: string | null) => commit({ ...model, company: { ...model.company, logo } })
  const changePageSize = (pageSize: PageSize) => {
    setCurrentPageSize(pageSize)
    commit({ ...model, pageSize })
  }
  // ponytail: display-only currency switch; stored minor units are never converted
  const changeCurrency = (currency: DocumentModel['currency']) => commit({ ...model, currency })
  const toggleVisibility = (blockId: BlockId, visible: boolean) => {
    const current = model.settings?.blockVisibility ?? {}
    commit({ ...model, settings: { ...model.settings, blockVisibility: { ...current, [blockId]: visible } } })
  }

  return {
    currentTemplate,
    currentPageSize,
    changeTemplate,
    changeBranding,
    changeLogo,
    changePageSize,
    changeCurrency,
    toggleVisibility,
  }
}
