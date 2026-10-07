import { DOC_TITLES } from './tokens'
import type { DocumentModel } from './types'
import { newInvoice } from './newInvoice'
import { agreementBlocks } from './starters/agreement'
import { briefBlocks } from './starters/brief'
import { deliveryGuideBlocks } from './starters/deliveryGuide'
import { feedbackBlocks } from './starters/feedback'
import { monthlyReportBlocks } from './starters/monthlyReport'
import { thankYouBlocks } from './starters/thankYou'
import { welcomeBlocks } from './starters/welcome'
import type { NewId } from './starters/compose'
import type { Block } from './blocks'

interface NewDocumentArgs {
  type: DocumentModel['type']
  id: string
  projectId: string
  today: string
  newId: (n: number) => string
}

// Starter blocks for document types that have sample content.
const STARTERS: Partial<Record<DocumentModel['type'], (newId: NewId, today: string) => Block[]>> = {
  agreement: agreementBlocks,
  brief: briefBlocks,
  welcome: welcomeBlocks,
  deliveryGuide: deliveryGuideBlocks,
  thankYou: thankYouBlocks,
  monthlyReport: monthlyReportBlocks,
  feedback: feedbackBlocks,
}

const MONEY_TYPES = new Set<DocumentModel['type']>(['quote', 'invoice', 'receipt', 'creditNote'])

// Starting draft for any document type: money documents get line items, the others a block outline.
export function newDocument({ type, id, projectId, today, newId }: NewDocumentArgs): DocumentModel {
  if (MONEY_TYPES.has(type)) return { ...newInvoice({ id, projectId, today }), type }
  const starter = STARTERS[type]
  if (starter) return { ...newInvoice({ id, projectId, today }), type, blocks: starter(newId, today) }
  return { ...newInvoice({ id, projectId, today }), type, blocks: [{ id: newId(1), type: 'heading', text: DOC_TITLES[type] }] }
}
