import { describe, expect, it } from 'vitest'

import { canDeleteProject, projectAfterSend, sendBlockedReason } from '../lifecycle'
import { createProject } from '../project'

const NOW = '2026-10-07T10:00:00.000Z'
const lead = { ...createProject({ id: 'p', title: 'Pitch', now: NOW }), state: 'lead' as const, prospectName: 'Acme' }

describe('sending from a lead', () => {
  it('lets a lead send a quote to a prospect but nothing else until it has a real client', () => {
    expect(sendBlockedReason(lead, 'quote')).toBeNull()
    expect(sendBlockedReason(lead, 'invoice')).toBe('Add a client to this project before sending anything other than a quote.')
    expect(sendBlockedReason({ ...lead, clientId: 'c1' }, 'invoice')).toBeNull()
  })

  it('turns a lead active on its first non-quote send', () => {
    expect(projectAfterSend({ ...lead, clientId: 'c1' }, 'agreement').state).toBe('active')
    expect(projectAfterSend(lead, 'quote').state).toBe('lead')
    expect(projectAfterSend({ ...lead, state: 'completed' }, 'invoice').state).toBe('completed')
  })
})

describe('canDeleteProject', () => {
  it('allows deleting only while no money document has been sent', () => {
    expect(canDeleteProject([{ type: 'invoice', status: 'draft' }, { type: 'welcome', status: 'sent' }])).toBe(true)
    expect(canDeleteProject([{ type: 'receipt', status: 'sent' }])).toBe(false)
    expect(canDeleteProject([{ type: 'invoice', status: 'void' }])).toBe(false)
  })
})
