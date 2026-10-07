import { describe, expect, it } from 'vitest'
import { DOC_TYPE_IDS, DOC_TYPES } from '../../document/docTypes'
import { documentSchema } from '../../document/types'
import { projectSchema } from '../project'
import { clientSchema } from '../client'
import { createSampleProject } from '../sampleProject'

const company = { name: 'Northwind Studio', address: ['12 Harbor Lane'], email: 'hello@northwind.test', logo: null }
let n = 0
const sample = createSampleProject({ now: '2026-10-07T10:00:00.000Z', today: '2026-10-07', locale: 'en-US', company, newId: () => `id-${++n}` })

describe('createSampleProject', () => {
  it('is a valid project flagged as the sample, with a valid client', () => {
    expect(projectSchema.parse(sample.project).sample).toBe(true)
    expect(clientSchema.parse(sample.client).id).toBe(sample.project.clientId)
  })

  it('holds one valid document of every type, all from your company', () => {
    expect(sample.documents.map((d) => d.type).sort()).toEqual([...DOC_TYPE_IDS].sort())
    for (const doc of sample.documents) {
      expect(documentSchema.safeParse(doc).success, doc.type).toBe(true)
      expect(doc.projectId).toBe(sample.project.id)
      expect(doc.company).toEqual(company)
    }
  })

  it('numbers its documents with a SAMPLE- prefix so real sequences are never used', () => {
    for (const doc of sample.documents.filter((d) => DOC_TYPES[d.type].numbered)) expect(doc.number, doc.type).toMatch(/^SAMPLE-/)
  })

  it('links the credit note and reminder to the sample invoice', () => {
    const invoice = sample.documents.find((d) => d.type === 'invoice')
    expect(sample.documents.find((d) => d.type === 'creditNote')?.creditFor).toBe(invoice?.id)
    expect(sample.documents.find((d) => d.type === 'reminder')?.reminderFor).toBe(invoice?.id)
  })
})
