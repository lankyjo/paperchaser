import type { TemplateLayout } from '../templateLayouts'
import { AtelierHeader } from './AtelierHeader'
import { AtelierPageMark } from './AtelierPageMark'
import './atelier.css'

export const atelierLayout: TemplateLayout = {
  Header: AtelierHeader,
  Footer: () => null,
  PageMark: AtelierPageMark,
  datesInHeader: true,
}
