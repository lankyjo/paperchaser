import { isMoneyDocument } from '../../document/documentBlocks'
import { SectionsOutline } from '../builder/SectionsOutline'
import { ServicePicker } from '../catalog/ServicePicker'
import { OutlinePane } from '../OutlinePane'
import { useWorkspace } from './workspaceContext'

// Line items (money documents only), saved services and the document's sections.
export function OutlinePanel() {
  const { model, editable, sections, outlineProps, onInsertItem } = useWorkspace()
  const money = isMoneyDocument(model)
  return (
    <aside aria-label="Outline" className="h-full overflow-y-auto bg-card p-3">
      {money && <OutlinePane {...outlineProps} />}
      {editable && money && onInsertItem && <ServicePicker onInsert={onInsertItem} />}
      {editable && <SectionsOutline sections={sections} />}
    </aside>
  )
}
