import { MobileSheets } from '../mobile/MobileSheets'
import type { PropertiesPaneProps } from '../PropertiesPane'
import { DesktopWorkspace } from '../workspace/DesktopWorkspace'
import { WorkspaceContext, type WorkspaceState } from '../workspace/workspaceContext'
import { MobileStack } from './MobileStack'

interface EditorLayoutProps {
  workspace: WorkspaceState
  isDesktop: boolean
  saveFailed: boolean
  sharedPropertiesProps: Omit<PropertiesPaneProps, 'selectedItemId'>
}

// The dockview workspace on desktop; on mobile, the sheet buttons over a fixed preview and outline.
export function EditorLayout({ workspace, isDesktop, saveFailed, sharedPropertiesProps }: EditorLayoutProps) {
  if (isDesktop) {
    return (
      <WorkspaceContext.Provider value={workspace}>
        <DesktopWorkspace />
      </WorkspaceContext.Provider>
    )
  }
  const { model, template, pageSize, outlineProps, editable, sections, onCommit, showExplainer } = workspace
  return (
    <>
      <MobileSheets model={model} propertiesProps={sharedPropertiesProps} showExplainer={showExplainer} />
      <MobileStack model={model} template={template} pageSize={pageSize} outlineProps={outlineProps} editable={editable} sections={sections} saveFailed={saveFailed} onCommit={onCommit} />
    </>
  )
}
