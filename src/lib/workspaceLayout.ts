// A saved dockview layout is reused only when it holds exactly the panels the workspace knows; anything else falls back to the default.
export function isRestorableLayout(saved: unknown, panelIds: string[]): boolean {
  if (typeof saved !== 'object' || saved === null || !('grid' in saved) || !('panels' in saved)) return false
  const panels = (saved as { panels: unknown }).panels
  if (typeof panels !== 'object' || panels === null) return false
  const components = Object.values(panels).map((p: { contentComponent?: string }) => p?.contentComponent)
  return components.length === panelIds.length && panelIds.every((id) => components.includes(id))
}
