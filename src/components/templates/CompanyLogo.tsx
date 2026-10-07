import type { DocumentModel } from '../../document/types'
import { LocalImage } from '../document-page/LocalImage'

// The sender's logo for a template header, or nothing; on a dark page it prefers the logo made for dark backgrounds.
export function CompanyLogo({ model, className, onDark = false }: { model: DocumentModel; className?: string; onDark?: boolean }) {
  const logo = (onDark && model.company.logoOnDark) || model.company.logo
  if (!logo) return null
  return <LocalImage src={logo} alt="" className={className ? `document-logo ${className}` : 'document-logo'} />
}
