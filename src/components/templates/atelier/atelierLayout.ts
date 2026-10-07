import type { TemplateLayout } from '../templateLayouts'
import { AtelierFooter } from './AtelierFooter'
import { AtelierHeader } from './AtelierHeader'
import { AtelierPageMark } from './AtelierPageMark'
import './atelier.css'

export const atelierLayout: TemplateLayout = {
  Header: AtelierHeader,
  Footer: AtelierFooter,
  PageMark: AtelierPageMark,
}
