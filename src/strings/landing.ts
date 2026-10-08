// Copy for the public landing page; every claim matches what the app does today.
export const LANDING_COPY = {
  nav: { howItWorks: 'How it works', open: 'Open the app' },
  headline: ['Paperwork,', 'chased.'],
  lead: 'The quotes, agreements, invoices and receipts of every client job, made and tracked in one free app that never leaves your device.',
  start: 'Start for free',
  closing: ['Chase less.', 'Get paid.'],
  closingCta: 'Open Paperchaser',
  footer: 'Free. Offline. Your data stays on your device.',
  what: 'What goes in it',
  does: 'Paperchaser does',
  tip: 'Tip.',
}

export type LandingStep = { title: string; purpose: string; what: string[]; does: string[]; tip: string }

// The ten pipeline steps, what each document holds, what the app does for it and one tip.
export const LANDING_STEPS: LandingStep[] = [
  { title: 'Quote', purpose: 'Say what you will do and what it costs, before any work starts.', what: ['What you will deliver', 'Price per item or a fixed fee', 'How long the offer is valid', 'What is not included'], does: ['An accepted quote sets the project fee', 'Revisions are numbered ‑R2, ‑R3'], tip: 'Keep it short. If the client accepts, the price flows into the agreement and invoices.' },
  { title: 'Agreement', purpose: 'Agree scope, payment and rights in writing, with a payment schedule.', what: ['Scope of work', 'Fees and a payment schedule', 'Revisions', 'Ownership and usage rights', 'Signatures'], does: ['Plain-language clauses to start from', 'The schedule creates the deposit and balance invoices'], tip: 'Do not start work until it is signed. The clauses are a starting point, not legal advice.' },
  { title: 'Welcome', purpose: 'Show you are organised and explain what happens next.', what: ['A friendly greeting', 'The project at a glance', 'Next steps and dates', 'How to reach you'], does: ['Starts with sample wording', 'Client details filled in from the project'], tip: 'Send it right after the agreement is signed, while the client is excited.' },
  { title: 'Brief', purpose: 'Define what the work must achieve, so feedback has a reference.', what: ['The objective', 'The target audience', 'Key message', 'Format and deadline'], does: ['Marks every part still to fill in', 'Warns before you send it unfinished'], tip: 'Ask the client to approve the brief. It is your reference for every revision.' },
  { title: 'Invoice', purpose: 'Ask to be paid, with your bank details and a due date.', what: ['Your details and the client’s', 'Number and dates', 'Line items, tax and total', 'Payment details'], does: ['Numbers itself when you finalize', 'Late invoices show on your home screen', 'One-click payment reminders'], tip: 'A deposit and a balance are two separate invoices.' },
  { title: 'Delivery guide', purpose: 'Hand over every file and say how it may be used.', what: ['Every file delivered', 'Where to download it', 'When the link expires', 'How the work may be used'], does: ['A file table that prints cleanly', 'Locks once sent, so the record stays true'], tip: 'Deliver final files only after the balance invoice is paid.' },
  { title: 'Monthly report', purpose: 'Show retainer clients the results you delivered.', what: ['A short summary', 'Key numbers', 'What was published', 'Plans for next month'], does: ['Paste a spreadsheet to draw the chart', 'New for next month copies it forward'], tip: 'Regular reports make rate increases easier to ask for.' },
  { title: 'Receipt', purpose: 'Confirm each payment that arrived.', what: ['Which invoice was paid', 'Amount and date received', 'Payment method', 'Any balance still due'], does: ['Made from the payment you recorded', 'The balance updates by itself'], tip: 'One receipt per payment, so a deposit and a balance each get their own.' },
  { title: 'Thank you', purpose: 'End warmly and leave the door open for more work.', what: ['A personal thank-you', 'A highlight of the work', 'How to work together again'], does: ['Your signature, drawn once and reused'], tip: 'Send it when the final files are delivered, before asking for feedback.' },
  { title: 'Feedback', purpose: 'Ask how it went and collect a testimonial.', what: ['Ratings for key areas', 'Open questions', 'Permission to quote them'], does: ['Prints tick boxes the client can fill on paper', 'Log the answers when it comes back'], tip: 'Keep it to a few minutes. Ask while the project is still fresh.' },
]
