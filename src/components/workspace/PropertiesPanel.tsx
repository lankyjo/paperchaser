import { PropertiesPane } from '../PropertiesPane'
import { useWorkspace } from './workspaceContext'

// Template, branding, dates and page size, or the selected line item.
export function PropertiesPanel() {
  return (
    <aside aria-label="Properties" className="h-full overflow-y-auto bg-card p-3">
      <PropertiesPane {...useWorkspace().propertiesProps} />
    </aside>
  )
}
