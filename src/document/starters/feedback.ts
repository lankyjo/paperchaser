import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

export const feedbackBlocks = (newId: NewId): Block[] => [
  heading(newId(), 'Your feedback matters'),
  paragraphs(newId(), ['This takes about three minutes. Honest answers help us improve and help future clients decide whether to work with us. Thank you, [Client name].']),
  {
    id: newId(),
    type: 'rating',
    title: 'Overall ratings',
    questions: ['Overall satisfaction with the project', 'Communication and responsiveness', 'Quality of the final work', 'Turnaround and project management', 'Value for money'].map((text) => ({ text })),
  },
  {
    id: newId(),
    type: 'keyValue',
    title: 'In your own words',
    rows: [
      'What was your biggest concern before working with us?',
      'What did you like most?',
      'What could we have done better?',
      'May we quote you on our website?',
    ].map((label) => ({ label, value: '' })),
  },
]
