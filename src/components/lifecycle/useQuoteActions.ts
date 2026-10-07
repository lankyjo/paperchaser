import { useNavigate } from '@tanstack/react-router'
import { documentsRepo, projectsRepo } from '../../db/repos'
import { printedTotals } from '../../document/finalize'
import { acceptQuote, declineQuote, reviseQuote } from '../../document/quotes'
import type { DocumentModel } from '../../document/types'
import type { Project } from '../../project/project'

// Client answers to a sent quote: accept (sets the project fee), decline (optionally losing the project), or revise.
export function useQuoteActions(quote: DocumentModel, project: Project | undefined, save: (next: DocumentModel) => Promise<void>) {
  const navigate = useNavigate()
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
      const revision = reviseQuote(quote, { id: crypto.randomUUID(), today: new Date().toLocaleDateString('en-CA') })
      await documentsRepo.put(revision)
      await save({ ...quote, supersededBy: revision.id })
      await navigate({ to: '/documents/$documentId', params: { documentId: revision.id } })
    },
    openLatest: () => quote.supersededBy && navigate({ to: '/documents/$documentId', params: { documentId: quote.supersededBy } }),
  }
}
