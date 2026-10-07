import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

export const deliveryGuideBlocks = (newId: NewId): Block[] => [
  heading(newId(1), 'Your deliverables are ready'),
  paragraphs(newId(2), ['All files are ready to download. Please read this guide before you share or publish anything, [Client name].']),
  heading(newId(3), "What's included"),
  {
    id: newId(4),
    type: 'table',
    columns: ['File name', 'Format', 'Size or scope', 'Platform', 'Notes'],
    rows: [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ],
  },
  { id: newId(5), type: 'keyValue', title: 'How to access your files', rows: ['Download link', 'Password', 'Link expires'].map((label) => ({ label, value: '' })) },
  paragraphs(newId(6), [{ lead: 'Using the files.', text: 'You may use the final files for [the agreed purposes]. Please credit [Your business] when you post them.' }]),
]
