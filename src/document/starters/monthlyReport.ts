import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

const monthName = (today: string) => new Date(`${today}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const monthlyReportBlocks = (newId: NewId, today: string): Block[] => [
  heading(newId(1), `Monthly Report — ${monthName(today)}`),
  { id: newId(2), type: 'keyValue', title: 'Report', rows: ['Client', 'Period', 'Prepared by'].map((label) => ({ label, value: '' })) },
  heading(newId(3), 'Summary'),
  paragraphs(newId(4), ['[Two or three sentences on the month: what was delivered, what performed best, and what changed.]']),
  {
    id: newId(5),
    type: 'metrics',
    items: [
      { label: 'Total views', value: '', note: '' },
      { label: 'Engagement rate', value: '', note: '' },
      { label: 'New followers', value: '', note: '' },
    ],
  },
  heading(newId(6), 'Published this month'),
  { id: newId(7), type: 'table', columns: ['Date', 'Platform', 'Title', 'Views', 'Engagement'], rows: [['', '', '', '', '']] },
  { id: newId(8), type: 'chart', title: 'Views by week', series: [1, 2, 3, 4].map((w) => ({ label: `Week ${w}`, value: 0 })) },
  heading(newId(9), 'Next month'),
  paragraphs(newId(10), ['[What you plan to focus on next month and why.]']),
]
