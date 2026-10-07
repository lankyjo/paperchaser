import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

export const thankYouBlocks = (newId: NewId): Block[] => [
  heading(newId(), 'Thank you'),
  paragraphs(newId(), [
    'Dear [Client name],',
    'Thank you for trusting us with [the project]. It was a real pleasure working together, and we are proud of what we made — especially [a highlight of the work].',
    'If you need anything else, or have a new project in mind, we would love to hear from you.',
  ]),
  { id: newId(), type: 'signature', assetId: '', name: '', role: '', clientLine: false },
]
