import type { DocumentModel } from './types'

// A welcome document with starter blocks: greeting, a short intro and a project-at-a-glance list.
export function newWelcome({
  id,
  projectId,
  today,
  newId,
}: {
  id: string
  projectId: string
  today: string
  newId: (n: number) => string
}): DocumentModel {
  return {
    id,
    projectId,
    type: 'welcome',
    currency: 'EUR',
    issueDate: today,
    number: '',
    status: 'draft',
    company: { name: '', address: [], email: '', logo: null },
    customer: { name: '', address: [] },
    lineItems: [],
    blocks: [
      { id: newId(1), type: 'heading', text: 'Welcome to the team' },
      {
        id: newId(2),
        type: 'richText',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: "We're excited to work with you. Here's everything you need to get started." }],
          },
        ],
      },
      {
        id: newId(3),
        type: 'keyValue',
        title: 'Your project at a glance',
        rows: [
          { label: 'Project', value: '' },
          { label: 'Start date', value: '' },
          { label: 'Point of contact', value: '' },
        ],
      },
    ],
  }
}
