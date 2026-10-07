import type { DocumentModel } from '../document/types'

export interface Explainer {
  short: string
  why: string
  what: string[]
  tip: string
}

// Plain-language guide to each pipeline step for people new to freelancing.
export const EXPLAINERS: Record<DocumentModel['type'], Explainer> = {
  quote: {
    short: 'Tell the client what you will do and what it will cost, before any work starts.',
    why: 'A quote turns a vague conversation into a clear offer. The client can say yes to a fixed scope and price, and you avoid arguments about cost later.',
    what: ['What you will deliver', 'Price per item or a fixed fee', 'How long the offer is valid', 'What is not included'],
    tip: 'Keep it short. If the client accepts, the price flows into the agreement and invoices.',
  },
  agreement: {
    short: 'Agree on scope, payment and rights in writing before you start.',
    why: 'An agreement protects both of you. It records what is included, when you get paid, how many revisions are allowed and who owns the work.',
    what: ['Scope of work', 'Fees and payment schedule (for example 50% deposit)', 'Revisions', 'Ownership and usage rights', 'Signatures'],
    tip: 'Do not start work until it is signed. The sample clauses are a starting point, not legal advice.',
  },
  welcome: {
    short: 'Make a great first impression and explain what happens next.',
    why: 'Clients feel nervous at the start. A welcome document shows you are organised and answers their first questions before they ask.',
    what: ['A friendly greeting', 'The project at a glance', 'Next steps and dates', 'How to reach you'],
    tip: 'Send it right after the agreement is signed, while the client is excited.',
  },
  brief: {
    short: 'Define exactly what the work should achieve before you begin.',
    why: 'A brief keeps you and the client on the same page. When feedback arrives later, you can check it against what you both agreed the goal was.',
    what: ['The objective', 'The target audience', 'Key message', 'Format and deadline'],
    tip: 'Ask the client to approve the brief. It is your reference point for every revision.',
  },
  invoice: {
    short: 'Ask to be paid: what you did, how much, and how to pay you.',
    why: 'An invoice is the formal request for payment. Clear invoices get paid faster and are what tax offices expect to see.',
    what: ['Your details and the client details', 'Invoice number and dates', 'Line items with prices', 'Tax and total', 'Payment details'],
    tip: 'Always include a due date and your bank details. A deposit and a balance are two separate invoices.',
  },
  deliveryGuide: {
    short: 'Hand over the final work in a way that feels premium.',
    why: 'How you deliver is part of the experience. A delivery guide lists every file, where to get it and how the client may use it, so nothing gets lost.',
    what: ['Every file delivered', 'Download link and access details', 'When the link expires', 'How the work may be used'],
    tip: 'Deliver final files only after the balance invoice is paid.',
  },
  monthlyReport: {
    short: 'Show retainer clients the results you delivered this month.',
    why: 'Regular reports prove your value. Clients who see results keep working with you and accept rate increases more easily.',
    what: ['A short summary', 'Key numbers', 'What was published or delivered', 'Plans for next month'],
    tip: 'Use "New for next month" to start the next report from this one.',
  },
  receipt: {
    short: 'Confirm that a payment arrived.',
    why: 'A receipt is proof of payment for the client\'s records and yours. It closes the loop on an invoice.',
    what: ['Which invoice was paid', 'Amount and date received', 'Payment method', 'Any balance still due'],
    tip: 'Create one receipt per payment, so a deposit and a balance each get their own.',
  },
  thankYou: {
    short: 'End the project warmly and leave the door open for more work.',
    why: 'A thank-you note is remembered. It turns a finished project into a relationship and makes referrals more likely.',
    what: ['A personal thank-you', 'A highlight of the work', 'How to work together again'],
    tip: 'Send it when the final files are delivered, before asking for feedback.',
  },
  feedback: {
    short: 'Ask the client how it went, so you can improve and win more work.',
    why: 'Feedback shows you what to keep and what to fix. Good answers become testimonials that help you win the next client.',
    what: ['Ratings for key areas', 'Open questions', 'Permission to quote them'],
    tip: 'Keep it to a few minutes. Ask while the project is still fresh.',
  },
  creditNote: {
    short: 'Correct or cancel part of an invoice that was already paid.',
    why: 'You should not delete or edit a paid invoice. A credit note records the correction with its own number, which keeps your records honest.',
    what: ['The invoice it corrects', 'What is being credited and why', 'The credited amount'],
    tip: 'Use a credit note for refunds or mistakes on paid invoices; unpaid ones can simply be voided.',
  },
}
