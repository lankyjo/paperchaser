import { describe, expect, it } from 'vitest'
import { isRestorableLayout } from '../workspaceLayout'

const PANELS = ['outline', 'canvas', 'properties']
const layout = (components: string[]) => ({
  grid: { root: {}, width: 1, height: 1, orientation: 'HORIZONTAL' },
  panels: Object.fromEntries(components.map((c) => [c, { id: c, contentComponent: c }])),
})

describe('isRestorableLayout', () => {
  it('restores a layout holding exactly the known panels', () => {
    expect(isRestorableLayout(layout(PANELS), PANELS)).toBe(true)
  })

  it('rejects a layout with a missing or unknown panel, so the default is used instead', () => {
    expect(isRestorableLayout(layout(['outline', 'canvas']), PANELS)).toBe(false)
    expect(isRestorableLayout(layout([...PANELS, 'old-doc-123']), PANELS)).toBe(false)
  })

  it('rejects anything that is not a saved layout', () => {
    expect(isRestorableLayout(undefined, PANELS)).toBe(false)
    expect(isRestorableLayout({ panels: 'x' }, PANELS)).toBe(false)
  })
})
