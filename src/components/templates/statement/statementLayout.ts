import type { TemplateLayout } from '../templateLayouts'
import { StatementFooter } from './StatementFooter'
import { StatementHeader } from './StatementHeader'
import './statement.css'

export const statementLayout: TemplateLayout = {
  Header: StatementHeader,
  Footer: StatementFooter,
}
