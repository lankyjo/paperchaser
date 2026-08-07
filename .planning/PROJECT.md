# Paperchaser

## What This Is

Paperchaser is a frontend-first, local-first business document workspace that lets freelancers and small businesses create professional invoices, quotes, and receipts entirely in the browser — no accounts, no backend, no sign-up. All data lives in the user's browser (IndexedDB) and can be backed up and restored as JSON.

Unlike accounting software, Paperchaser is exclusively a document creation tool. It deliberately excludes bookkeeping, inventory, payment processing, CRM, and tax filing.

## Core Value

Create a professional, print-ready business document (invoice, quote, or receipt) in under five minutes with a true WYSIWYG editing experience, entirely offline in the browser.

## Business Context

- **Customer**: Freelancers and small businesses who send invoices, quotes, and receipts without full accounting software
- **Revenue model**: TBD (not yet decided; likely future premium/template marketplace per PRD future scope)
- **Success metric**: TBD — placeholder: documents created per user; 5-minute creation time for first document
- **Strategy notes**: See `/home/ikeji/Downloads/Invoice_Workspace_PRD_v1.md` (source PRD)

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Create professional invoices, quotes, and receipts via one shared document engine
- [ ] Dashboard with recent documents/customers/products, quick actions, search, and local statistics
- [ ] Three-pane document builder: section outline/layers, live canvas, element properties
- [ ] Mobile builder using bottom sheets, drawers, and sticky live preview
- [ ] Template system (Blank, Minimal, Modern, Corporate, Freelancer, Agency, Creative) controlling style only, not structure
- [ ] Single company profile (name, logo, signature, stamp, contact, tax/bank details, payment instructions)
- [ ] Customer management (create/edit/delete/search/reuse) with billing and shipping addresses
- [ ] Product catalog of reusable items with price, tax, category, SKU, favorites, quick insert
- [ ] Line items with title, description, quantity, unit price, discount, tax, image; duplicate/delete/reorder/collapse
- [ ] Totals math: subtotal, tax, shipping, fees, discount, grand total
- [ ] Branding: logo, primary/accent color, fonts, header/footer style, watermark (Draft/Paid)
- [ ] PDF generation: A4 default, optional page sizes, automatic pagination, print margins, identical preview/output, download, browser print
- [ ] Local persistence via IndexedDB (Dexie) for profile, customers, catalog, documents, preferences
- [ ] JSON import/export: single document and full workspace backup/restore
- [ ] Validation: missing company/customer, empty line items, duplicate document number, invalid dates, negative values, missing payment details
- [ ] Compliance guidance checklist (invoice number, issue date, seller/buyer details, currency, totals, tax, payment info) — guidance only, no country-specific legal validation
- [ ] Auto-save, undo/redo, zoom, drag-and-drop section/line-item ordering, print preview

### Out of Scope

- Accounting — the product is document creation only (PRD §1, §3 Non Goals)
- Inventory management — PRD non-goal
- Expense tracking — PRD non-goal
- CRM — PRD non-goal
- Payment collection — PRD non-goal
- Team collaboration — PRD non-goal, future scope
- Cloud sync — conflicts with privacy-first/local-first principle; future scope
- Email sending — PRD non-goal, future scope

## Context

Source: `Invoice_Workspace_PRD_v1.md` (v1, name TBD). Product principles: frontend-first, privacy-first, local-first (IndexedDB), JSON import/export, mobile-first, professional output, beginner friendly, highly customizable without being overwhelming.

Open questions carried from the PRD to be resolved during planning: final product name (tentatively Paperchaser), exact template count for v1, supported currencies at launch, PDF engine evaluation against complex layouts, exact mobile interaction patterns, accessibility acceptance criteria.

The PRD pins TanStack Start (full-stack framework) for an explicitly frontend-only app, and @react-pdf/renderer for PDF despite the PRD listing PDF engine choice as an open question. Per user decision these are kept as written but must be validated in a Phase 1 spike — notably the "identical preview/output" requirement (PRD §6.9) that react-pdf may strain at editing speed.

## Constraints

- **Tech stack**: Vite 8 SPA + TanStack Router 1.170.22, TypeScript (~6.0.3 strict), Tailwind v4, shadcn/ui (base-nova, Base UI), Dexie (IndexedDB), vite-plugin-pwa, print-CSS primary PDF path with @react-pdf/renderer 4.5.1 as documented fallback (ADR 0001, ADR 0002) — overrides PRD §7 pins (TanStack Start, react-pdf) per the PRD's own Phase 1 validation mandate
- **No backend**: No user accounts, no server, no cloud sync — privacy-first and local-first are non-negotiable (PRD §2)
- **Mobile-first**: Must work beautifully on desktop and mobile (PRD §3)
- **PDF parity**: PDF output must be identical to on-screen preview (PRD §6.9)
- **Performance**: Document creation in under five minutes (PRD §3)
- **Compliance**: v1 provides guidance only, not country-specific legal validation (PRD §6.12)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Product name: Paperchaser | Matches project directory; working title | — Pending |
| Framework: Vite 8 SPA + TanStack Router (overturns PRD's TanStack Start pin) | Start is RC + needs Node >= 22.12 server runtime for zero in-scope server features; Router-alone guidance | Validated — ADR 0001, Phase 1 |
| PDF path: print-CSS primary (overturns PRD's react-pdf pin) | Safari 18.2+ paged-media fidelity, per-page watermark, zero edit-time latency vs full regeneration; harness-measured evidence | Validated — ADR 0002, Phase 1; Safari acceptance step PENDING (only open item, does not block Phase 2) |
| Golden-image parity harness (Playwright + pixelmatch + pdfjs-dist) required before editing UX | "Identical preview/output" is the product's core promise (PRD §6.9); harness proves preview == print == PDF on fixture documents | Validated — Phase 1, plan 01-02 |
| CI baseline = green gate mirroring local scripts, never writes baselines | Same gates dev runs; committed goldens drift-guarded | Validated — Phase 1, plan 01-03 |
| Validate stack in Phase 1 spike | PRD itself lists PDF engine as an open question; preview/output parity is at risk | Done — resolved both decisions via ADRs |
| Greenfield, git init in this directory | Empty dir, clean start, auto mode | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-07 after Phase 1*
