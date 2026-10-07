import type { Block } from '../blocks'
import { heading, paragraphs, type NewId } from './compose'

// Plain-language starter clauses; the editor shows that they are not legal advice.
export const agreementBlocks = (newId: NewId): Block[] => [
  heading(newId(), 'Client Agreement'),
  paragraphs(newId(), ['This agreement is between [Your business] ("the Service Provider") and [Client name] ("the Client") for the project described below. Nothing gets started until both parties have signed.']),
  { id: newId(), type: 'keyValue', title: 'The project', rows: [{ label: 'Project', value: '' }, { label: 'Start date', value: '' }, { label: 'Delivery date', value: '' }] },
  paragraphs(newId(), [
    { lead: 'Scope of work.', text: 'The Service Provider will deliver [the deliverables listed in the project brief]. Work outside this scope is quoted separately and needs written agreement from both parties.' },
    { lead: 'Revisions.', text: 'Each deliverable includes [2] rounds of revisions. A round is one consolidated set of changes sent in writing. Extra rounds are billed at [rate per round]. Feedback not received within [7] days of a draft counts as approval.' },
    { lead: 'Payment.', text: 'Fees are paid according to the schedule below. Invoices are due within [14] days. Final files are delivered once the balance is paid.' },
    { lead: 'Intellectual property.', text: 'All rights in the final delivered work transfer to the Client on receipt of full payment. Until then they stay with the Service Provider, including drafts and source files.' },
    { lead: 'Usage and credit.', text: 'The Client may use the final work for [the purposes described]. The Service Provider may show the work in their portfolio unless the Client asks otherwise in writing.' },
    { lead: 'Cancellation.', text: 'Either party may end this agreement in writing. The deposit is non-refundable and work completed up to that point is billed.' },
  ]),
  { id: newId(), type: 'paymentSchedule', totalMinor: 0, taxRateMinor: 0, rows: [{ id: newId(), label: 'Deposit', percentMinor: 5000, due: 'On signing' }, { id: newId(), label: 'Balance', percentMinor: 5000, due: 'On delivery' }] },
  { id: newId(), type: 'signature', assetId: '', name: '', role: '', clientLine: true },
]
