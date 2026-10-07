import { documentsRepo } from '../../db/repos'
import { unsendDocument } from '../../document/finalize'
import type { DocumentModel } from '../../document/types'
import { pullLatest, type SharedData } from '../../project/sharedData'
import { printDocument } from './printDocument'

// Finalize, unsend and pull-latest for the open document; each saves immediately and replaces the editor state.
export function useDocumentLifecycle(model: DocumentModel, replace: (next: DocumentModel) => void, shared: SharedData | undefined) {
  const save = async (next: DocumentModel) => {
    await documentsRepo.put(next)
    replace(next)
  }
  return {
    finalizeAndPrint: async () => {
      const finalized = await documentsRepo.finalize(model, new Date())
      replace(finalized)
      requestAnimationFrame(() => printDocument(finalized))
    },
    print: () => printDocument(model),
    unsend: () => save(unsendDocument(model)),
    pullLatest: shared ? () => save(pullLatest(model, shared)) : undefined,
  }
}
