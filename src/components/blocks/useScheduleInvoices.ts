import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { documentsRepo } from '../../db/repos'
import { invoiceForScheduleRow, type ScheduleBlock } from '../../document/schedule'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import type { ScheduleActions } from './scheduleContext'

// Invoices billed from this agreement's schedule rows, and creating the next one with earlier rows as deductions.
export function useScheduleInvoices(agreement: DocumentModel): ScheduleActions {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<DocumentModel[]>([])
  useMountEffect(() => {
    void documentsRepo.byProject(agreement.projectId).then((docs) => setInvoices(docs.filter((d) => d.scheduleRef?.agreementId === agreement.id)))
  })

  const schedule = agreement.blocks?.find((b): b is ScheduleBlock => b.type === 'paymentSchedule')
  const openInvoice = (invoice: DocumentModel) => void navigate({ to: '/documents/$documentId', params: { documentId: invoice.id } })
  const invoiceForRow = (rowId: string) => invoices.find((i) => i.scheduleRef?.rowId === rowId && i.status !== 'void')

  const createInvoice = (rowId: string) => {
    if (!schedule) return
    const earlierRows = schedule.rows.slice(0, schedule.rows.findIndex((r) => r.id === rowId)).map((r) => r.id)
    const priorInvoices = earlierRows.map(invoiceForRow).filter((i): i is DocumentModel => i !== undefined)
    const invoice = invoiceForScheduleRow(schedule, rowId, {
      id: crypto.randomUUID(),
      projectId: agreement.projectId,
      agreementId: agreement.id,
      today: new Date().toLocaleDateString('en-CA'),
      priorInvoices,
    })
    void documentsRepo.put({ ...invoice, currency: agreement.currency, locale: agreement.locale, taxMode: agreement.taxMode }).then(() => openInvoice(invoice))
  }

  return { invoiceForRow, createInvoice, openInvoice }
}
