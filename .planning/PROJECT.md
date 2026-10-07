# Paperchaser

## What This Is

Paperchaser is a free, offline, browser-only workspace that walks freelancers and small studios through a whole client engagement — from quote and agreement to delivery, invoicing, receipt and feedback. Every project and document is plain JSON stored in the browser (IndexedDB). There are no accounts, no backend and no paid tier.

It records the business side of client work; it never moves money. Payments are recorded by hand, never collected.

## Core Value

Produce a professional, print-ready client document in under five minutes, with a WYSIWYG editor whose preview and printed PDF are identical, entirely offline.

## The Pipeline

A **project** (title, client, fee, dates, deliverables) holds documents for each step, opened in any order:

Quote → Agreement → Welcome → Project Brief → Invoice → Delivery Guide → Monthly Report → Receipt → Thank You → Feedback, plus Credit Note under invoices.

Each step has a plain-language explainer for beginners. A "Quick invoice" button skips the project setup for one-off work.

## Requirements

### Validated

- Totals math in integer minor units with per-line rounding — `src/document/totals.ts`
- IndexedDB persistence via Dexie repos — `src/db/`
- Versioned JSON import boundary with structured rejection — `src/document/io.ts`
- Rich-text editing, undo/redo, autosave, drag reorder, zoom (editing behaviour still to be re-tested by hand)
- Print-CSS PDF path with a golden-image parity harness

### Active

- Projects with shared client/fee/date data; documents read it and can override single fields
- Reusable clients (archive-only when in use) and a catalog of saved services
- Typed block documents: heading, rich text, key-value, table, steps, metrics, chart, rating, checklist, signature, image, parties, line items, totals, payment schedule
- 11 document types with sample content, placeholders and pre-finalize checks
- Finalize & print: number assigned on finalize, full snapshot freeze, read-only sent documents
- Payments ledger (partial, paid, overpaid, refunds), receipts per payment, void and credit notes
- Agreement payment schedules that create invoice drafts; quote acceptance and revisions
- Tax modes (exclusive, inclusive, none); every ISO currency; locale-aware formatting and input
- 7 templates (Blank, Minimal, Noir Ledger, Atelier, Statement, Swiss, Correspondence) for every document type, with full branding controls and versioning for frozen documents
- Desktop dockview workspace; mobile layout with vaul bottom sheets; redesigned app UI
- Project and workspace export/import, Safari data-loss safeguards, first-run setup with a sample project
- Optional AI later: own key, OpenRouter or a local model, as validated patches only

### Out of Scope

- Collecting or processing payments — documents show payment details only
- Accounting, bookkeeping, tax filing or reports beyond a CSV export of money documents
- Email sending — the user sends the printed PDF themselves
- Accounts, backend, cloud sync — data stays in the browser; moving devices is export/import
- Country-specific legal validation — generic checks and "not legal advice" sample clauses only
- Paid tiers or a template marketplace — Paperchaser is free

## Constraints

- **Stack**: Vite SPA + TanStack Router, React 19, TypeScript strict, Tailwind v4, Base UI, Zod, Dexie, vite-plugin-pwa
- **Offline**: no network at runtime except an opt-in AI provider
- **PDF**: the browser print dialog is the only PDF path (see `docs/adr/0002-pdf-path.md`)
- **Parity**: on-screen preview and printed output must match page for page
- **Code**: the rules in `AGENTS.md`, enforced by `pnpm check:conventions`

## Key Decisions

| Decision | Reason |
|----------|--------|
| Free, offline, JSON in IndexedDB | Privacy-first; no server to run or trust |
| Projects + pipeline steps instead of standalone documents | Freelancers need the whole engagement, not one invoice |
| Print-CSS PDF only; react-pdf fallback dropped | One layout engine keeps preview and PDF identical across 7 templates × 11 document types |
| dockview (MIT) for the desktop workspace | Open source, mature, layout serializes to JSON |
| vaul for mobile sheets | React 19 support with drag and snap points |
| Numbers assigned on finalize, one sequence per type | No gaps from deleted drafts; matches what tax authorities expect |
| Sent documents freeze all data and computed totals | A sent document never changes after an app update or a profile edit |
