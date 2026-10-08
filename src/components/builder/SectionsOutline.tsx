import type { blockActions } from '../blocks/blockActions'
import { BlockOutline } from '../blocks/BlockOutline'

// The document's sections, with drag, hide, remove and add controls.
export function SectionsOutline({ sections }: { sections: ReturnType<typeof blockActions> }) {
  return (
    <div className="mt-4">
      <h2 className="mb-2 px-1 text-sm font-semibold">Sections</h2>
      <BlockOutline sections={sections} />
    </div>
  )
}
