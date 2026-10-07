import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

const monthName = (today: string) => new Date(`${today}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const monthlyReportBlocks = (newId: NewId, today: string): Block[] => [
  heading(newId(), `Monthly Report — ${monthName(today)}`),
  { id: newId(), type: 'keyValue', title: 'Report', rows: ['Client', 'Period', 'Prepared by'].map((label) => ({ label, value: '' })) },
  heading(newId(), 'Summary'),
  paragraphs(newId(), ['[Two or three sentences on the month: what was delivered, what performed best, and what changed.]']),
  {
    id: newId(),
    type: 'metrics',
    items: [
      { label: 'Total views', value: '', note: '' },
      { label: 'Engagement rate', value: '', note: '' },
      { label: 'New followers', value: '', note: '' },
    ],
  },
  heading(newId(), 'Published this month'),
  { id: newId(), type: 'table', columns: ['Date', 'Platform', 'Title', 'Views', 'Engagement'], rows: [['', '', '', '', '']] },
  { id: newId(), type: 'chart', title: 'Views by week', series: [1, 2, 3, 4].map((w) => ({ label: `Week ${w}`, value: 0 })) },
  heading(newId(), 'Next month'),
  paragraphs(newId(), ['[What you plan to focus on next month and why.]']),
]
