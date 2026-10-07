import { useOpenDocument } from '../../hooks/useOpenDocument'
import { documentsRepo, projectsRepo } from '../../db/repos'
import { printedTotals } from '../../document/finalize'
import { acceptQuote, declineQuote, reviseQuote } from '../../document/quotes'
import type { DocumentModel } from '../../document/types'
import type { Project } from '../../project/project'
import { todayIso } from '../../lib/todayIso'

// Client answers to a sent quote: accept (sets the project fee), decline (optionally losing the project), or revise.
export function useQuoteActions(quote: DocumentModel, project: Project | undefined, save: (next: DocumentModel) => Promise<void>) {
  const openDocument = useOpenDocument()
  return {
    accept: async () => {
      await save(acceptQuote(quote))
      if (project) await projectsRepo.put({ ...project, feeMinor: printedTotals(quote).subtotalMinor, updatedAt: new Date().toISOString() })
    },
    decline: () => save(declineQuote(quote)),
    markProjectLost: async () => {
      if (project) await projectsRepo.put({ ...project, state: 'lost', updatedAt: new Date().toISOString() })
    },
    revise: async () => {
      const revision = reviseQuote(quote, { id: crypto.randomUUID(), today: todayIso() })
      await documentsRepo.put(revision)
      await save({ ...quote, supersededBy: revision.id })
      await openDocument(revision)
    },
    openLatest: () => quote.supersededBy && openDocument(quote.supersededBy),
  }
}
