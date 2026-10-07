import type { TemplateLayout } from '../templateLayouts'
import { CorrespondenceFooter } from './CorrespondenceFooter'
import { CorrespondenceHeader } from './CorrespondenceHeader'
import './correspondence.css'

export const correspondenceLayout: TemplateLayout = {
  Header: CorrespondenceHeader,
  Footer: CorrespondenceFooter,
  datesInHeader: true,
}
