import { documentsRepo } from '../../db/repos'
import { voidDocument } from '../../document/credits'
import { unsendDocument } from '../../document/finalize'
import type { DocumentModel } from '../../document/types'
import { pullLatest, type SharedData } from '../../project/sharedData'
import { printDocument } from './printDocument'

// Finalize, unsend and pull-latest for the open document; each saves immediately (revision-checked) and replaces the editor state.
export function useDocumentLifecycle(
  model: DocumentModel,
  history: { replace: (next: DocumentModel) => void; getRev: () => number },
  shared: SharedData | undefined,
) {
  const { replace, getRev } = history
  const save = async (next: DocumentModel) => replace(await documentsRepo.save(next, getRev()))
  return {
    finalizeAndPrint: async () => {
      const finalized = await documentsRepo.finalize({ ...model, rev: getRev() }, new Date())
      replace(finalized)
      requestAnimationFrame(() => printDocument(finalized))
    },
    print: () => printDocument(model),
    unsend: () => save(unsendDocument(model)),
    voidDocument: () => save(voidDocument(model)),
    // Payments change after sending, so they save outside the read-only editor and outside undo.
    savePayments: (payments: NonNullable<DocumentModel['payments']>) => save({ ...model, payments }),
    pullLatest: shared ? () => save(pullLatest(model, shared)) : undefined,
  }
}
