import type { TemplateLayout } from '../templateLayouts'
import { SwissFooter } from './SwissFooter'
import { SwissHeader } from './SwissHeader'
import './swiss.css'

export const swissLayout: TemplateLayout = {
  Header: SwissHeader,
  Footer: SwissFooter,
}
