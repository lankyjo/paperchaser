import { describe, expect, it } from 'vitest'

import { PIPELINE_STEPS, projectProgress, stepStatus } from '../pipeline'

const doc = (type: string, status: 'draft' | 'sent' | 'paid') => ({ type, status })

describe('PIPELINE_STEPS', () => {
  it('lists the ten steps in pipeline order with invoice, receipt and monthly report holding several documents', () => {
    expect(PIPELINE_STEPS.map((s) => s.type)).toEqual([
      'quote', 'agreement', 'welcome', 'brief', 'invoice', 'deliveryGuide', 'monthlyReport', 'receipt', 'thankYou', 'feedback',
    ])
    expect(PIPELINE_STEPS.filter((s) => s.multi).map((s) => s.type)).toEqual(['invoice', 'monthlyReport', 'receipt'])
  })
})

describe('stepStatus', () => {
  it('derives a single-document step from its document, unless marked done', () => {
    expect(stepStatus('brief', [], [])).toBe('notStarted')
    expect(stepStatus('brief', [doc('brief', 'draft')], [])).toBe('draft')
    expect(stepStatus('brief', [doc('brief', 'sent')], [])).toBe('sent')
    expect(stepStatus('brief', [doc('brief', 'sent')], ['brief'])).toBe('done')
  })

  it('derives a multi-document step: any draft is draft, all settled is done', () => {
    expect(stepStatus('invoice', [doc('invoice', 'paid'), doc('invoice', 'draft')], [])).toBe('draft')
    expect(stepStatus('invoice', [doc('invoice', 'paid'), doc('invoice', 'sent')], [])).toBe('done')
    expect(stepStatus('invoice', [doc('quote', 'draft')], [])).toBe('notStarted')
  })
})

describe('projectProgress', () => {
  it('counts done steps out of ten', () => {
    expect(projectProgress([doc('invoice', 'paid'), doc('brief', 'sent')], ['brief'])).toEqual({ done: 2, total: 10 })
  })
})
