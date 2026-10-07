import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

export const briefBlocks = (newId: NewId): Block[] => [
  heading(newId(1), 'Project Brief'),
  {
    id: newId(2),
    type: 'keyValue',
    title: 'Project overview',
    rows: ['Client', 'Project or campaign', 'Channel or platform', 'Deliverable format', 'Start date', 'Deadline'].map((label) => ({ label, value: '' })),
  },
  heading(newId(3), 'Objective'),
  paragraphs(newId(4), ['What should this project make the audience do, feel or think? [Describe the outcome in one or two sentences].']),
  heading(newId(5), 'Target audience'),
  { id: newId(6), type: 'table', columns: ['Who they are', 'Their pain point', 'What they care about'], rows: [['', '', '']] },
  heading(newId(7), 'Key message'),
  paragraphs(newId(8), ['The single most important thing this work must communicate: [Key message].']),
]
