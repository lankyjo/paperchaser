import type { TemplateLayout } from '../templateLayouts'
import { NoirLedgerFooter } from './NoirLedgerFooter'
import { NoirLedgerHeader } from './NoirLedgerHeader'
import { NoirLedgerPageMark } from './NoirLedgerPageMark'
import './noir-ledger.css'

export const noirLedgerLayout: TemplateLayout = {
  Header: NoirLedgerHeader,
  Footer: NoirLedgerFooter,
  PageMark: NoirLedgerPageMark,
}
