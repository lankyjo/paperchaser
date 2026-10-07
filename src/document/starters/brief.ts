import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

export const briefBlocks = (newId: NewId): Block[] => [
  heading(newId(), 'Project Brief'),
  {
    id: newId(),
    type: 'keyValue',
    title: 'Project overview',
    rows: ['Client', 'Project or campaign', 'Channel or platform', 'Deliverable format', 'Start date', 'Deadline'].map((label) => ({ label, value: '' })),
  },
  heading(newId(), 'Objective'),
  paragraphs(newId(), ['What should this project make the audience do, feel or think? [Describe the outcome in one or two sentences].']),
  heading(newId(), 'Target audience'),
  { id: newId(), type: 'table', columns: ['Who they are', 'Their pain point', 'What they care about'], rows: [['', '', '']] },
  heading(newId(), 'Key message'),
  paragraphs(newId(), ['The single most important thing this work must communicate: [Key message].']),
]
