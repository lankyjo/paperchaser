import { useState } from 'react'
import { emailMessage } from '../../document/emailMessage'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'

// Copies a prefilled email (subject and body) for sending the PDF yourself, since the app never sends email.
export function CopyEmailButton({ doc }: { doc: DocumentModel }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    const { subject, body } = emailMessage(doc)
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
  }
  return (
    <Button size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? 'Email copied' : 'Copy email message'}
    </Button>
  )
}
