import { useOpenDocument } from '../../hooks/useOpenDocument'
import { useState } from 'react'
import { documentsRepo } from '../../db/repos'
import { findSchedule, invoiceForScheduleRow, priorScheduleInvoices } from '../../document/schedule'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'
import type { ScheduleActions } from './scheduleContext'
import { todayIso } from '../../lib/todayIso'

// Invoices billed from this agreement's schedule rows, and creating the next one with earlier rows as deductions.
export function useScheduleInvoices(agreement: DocumentModel): ScheduleActions {
  const openDocument = useOpenDocument()
  const [invoices, setInvoices] = useState<DocumentModel[]>([])
  useMountEffect(() => {
    void documentsRepo.byProject(agreement.projectId).then((docs) => setInvoices(docs.filter((d) => d.scheduleRef?.agreementId === agreement.id)))
  })

  const schedule = findSchedule(agreement)
  const openInvoice = (invoice: DocumentModel) => void openDocument(invoice)
  const invoiceForRow = (rowId: string) => invoices.find((i) => i.scheduleRef?.rowId === rowId && i.status !== 'void')

  const createInvoice = (rowId: string) => {
    if (!schedule) return
    const invoice = invoiceForScheduleRow(schedule, rowId, {
      id: crypto.randomUUID(),
      projectId: agreement.projectId,
      agreementId: agreement.id,
      today: todayIso(),
      priorInvoices: priorScheduleInvoices(schedule, rowId, invoices, agreement.id),
    })
    void documentsRepo.put({ ...invoice, currency: agreement.currency, locale: agreement.locale, taxMode: agreement.taxMode }).then(() => openInvoice(invoice))
  }

  return { invoiceForRow, createInvoice, openInvoice }
}
