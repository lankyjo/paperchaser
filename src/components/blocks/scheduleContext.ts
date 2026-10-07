import { createContext, useContext } from 'react'
import type { DocumentModel } from '../../document/types'

export interface ScheduleActions {
  invoiceForRow: (rowId: string) => DocumentModel | undefined
  createInvoice: (rowId: string) => void
  openInvoice: (invoice: DocumentModel) => void
}

// Row actions for payment schedules in a saved agreement; absent in previews, so rows show amounts only.
export const ScheduleContext = createContext<ScheduleActions | undefined>(undefined)

export const useScheduleActions = () => useContext(ScheduleContext)
