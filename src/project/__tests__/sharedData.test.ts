import { describe, expect, it } from 'vitest'

import { newInvoice } from '../../document/newInvoice'
import { getPlainText } from '../../document/richtext'
import { createClient } from '../client'
import { applySharedData, resetOverride, sharedFromClient, trackOverrides } from '../sharedData'

const client = { ...createClient({ id: 'c1', name: 'Acme Coffee' }), billingAddress: ['300 Main St', 'Portland'] }
const shared = sharedFromClient(client)
const draft = newInvoice({ id: 'd1', projectId: 'p1', today: '2026-10-07' })

describe('applySharedData', () => {
  it('fills a draft from the project client', () => {
    const doc = applySharedData(draft, shared)
    expect(getPlainText(doc.customer.name)).toBe('Acme Coffee')
    expect(doc.customer.address.map(getPlainText)).toEqual(['300 Main St', 'Portland'])
  })

  it('keeps overridden fields and never touches sent documents', () => {
    const overridden = { ...draft, customer: { name: 'Acme Wholesale', address: [] }, overrides: ['customer.name' as const] }
    expect(getPlainText(applySharedData(overridden, shared).customer.name)).toBe('Acme Wholesale')
    expect(applySharedData(overridden, shared).customer.address.map(getPlainText)).toEqual(['300 Main St', 'Portland'])
    const sent = { ...draft, status: 'sent' as const }
    expect(applySharedData(sent, shared)).toBe(sent)
  })
})

describe('trackOverrides', () => {
  it('marks a field overridden when it differs from the project and clears it when it matches again', () => {
    const edited = trackOverrides({ ...applySharedData(draft, shared), customer: { name: 'Acme Wholesale', address: ['300 Main St', 'Portland'] } }, shared)
    expect(edited.overrides).toEqual(['customer.name'])
    const reverted = trackOverrides({ ...edited, customer: { ...edited.customer, name: 'Acme Coffee' } }, shared)
    expect(reverted.overrides).toEqual([])
  })
})

describe('resetOverride', () => {
  it('restores the project value and drops the override', () => {
    const overridden = { ...draft, customer: { name: 'Acme Wholesale', address: [] }, overrides: ['customer.name' as const] }
    const reset = resetOverride(overridden, 'customer.name', shared)
    expect(getPlainText(reset.customer.name)).toBe('Acme Coffee')
    expect(reset.overrides).toEqual([])
  })
})
