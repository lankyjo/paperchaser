import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

export const welcomeBlocks = (newId: NewId): Block[] => [
  heading(newId(), 'Welcome to the team'),
  paragraphs(newId(), ["We're excited to work with you, [Client name]. Here's everything you need to get started. Questions at any point? Just reply — we're here."]),
  {
    id: newId(),
    type: 'keyValue',
    title: 'Your project at a glance',
    rows: ['Project', 'Start date', 'Final delivery', 'Point of contact'].map((label) => ({ label, value: '' })),
  },
  {
    id: newId(),
    type: 'steps',
    items: [
      { title: 'Discovery call', description: 'We align on goals, direction and logistics before we begin.' },
      { title: 'Project brief', description: 'You review and approve a short brief so we agree on what success looks like.' },
      { title: 'Production', description: 'We do the work; you just show up where needed.' },
      { title: 'First draft', description: 'You get the first version and send consolidated feedback.' },
      { title: 'Final delivery', description: 'Final files are delivered with a guide on how to use them.' },
    ],
  },
]
