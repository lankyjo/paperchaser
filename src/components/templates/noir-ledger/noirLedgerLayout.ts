import type { TemplateLayout } from '../templateLayouts'
import { NoirLedgerHeader } from './NoirLedgerHeader'
import { NoirLedgerPageMark } from './NoirLedgerPageMark'
import './noir-ledger.css'

export const noirLedgerLayout: TemplateLayout = {
  Header: NoirLedgerHeader,
  Footer: () => null,
  PageMark: NoirLedgerPageMark,
  datesInHeader: true,
}
