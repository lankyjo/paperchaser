import type { DocumentModel } from '../../document/types'
import { LocalImage } from '../document-page/LocalImage'

// The sender's logo for a template header, or nothing when there is none.
export function CompanyLogo({ model, className }: { model: DocumentModel; className?: string }) {
  if (model.company.logo === null) return null
  return <LocalImage src={model.company.logo} alt="" className={className ? `document-logo ${className}` : 'document-logo'} />
}
