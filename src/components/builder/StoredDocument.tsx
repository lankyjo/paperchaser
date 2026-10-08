import type { LoadedDocument } from './loadDocumentForEditing'
import { BuilderWorkspace } from './BuilderWorkspace'

// A stored document, loaded with its project's shared data applied, open in the builder.
export function StoredDocument({ loaded }: { loaded: LoadedDocument }) {
  return (
    <>
      {loaded.scheduleMismatch && (
        <p role="alert" className="mx-4 mt-2 rounded border border-destructive px-3 py-2 text-sm text-destructive print:hidden">
          This invoice no longer matches the agreement's payment schedule. Issue a credit note or a new invoice for the difference.
        </p>
      )}
      <BuilderWorkspace model={loaded.model} shared={loaded.shared} project={loaded.project} editable={!loaded.project?.archived} showExplainer />
    </>
  )
}
