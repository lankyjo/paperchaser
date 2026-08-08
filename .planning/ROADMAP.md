# Roadmap: Paperchaser

## Overview

Paperchaser is a browser-only, local-first document workspace for freelancers and small businesses: create professional invoices, quotes, and receipts with a true WYSIWYG builder, entirely offline, with pixel-identical PDF output. The journey is dependency-driven: a **blocking foundation spike** first proves the two gatekeeping technical decisions (framework and PDF engine) against explicit criteria; then a pure **domain core + persistence layer** encodes the document model, totals engine, and IndexedDB storage; then the **render pipeline** proves the product's core promise — identical preview/output — while documents are still small; then the **editing UX** (the differentiator) builds on a correct renderer, followed by **reference data UX** (company profile, customers, catalog) that accelerates the five-minute workflow; finally **validation, delivery, and polish** make the app shippable: guardrails, PDF download/print, workspace backup/restore, and the complete dashboard.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation Spike** - Prove framework and PDF-engine decisions on a realistic invoice; establish scaffold, CI, and parity harness (completed 2026-08-07)
- [x] **Phase 2: Domain Core & Persistence** - Pure document model, totals/money engine, IndexedDB storage, JSON import/export — zero UI (completed 2026-08-08)
- [ ] **Phase 3: Render Pipeline** - Templates, branding, PDF generation, print preview with provably identical preview/output
- [ ] **Phase 4: Editing UX** - Three-pane WYSIWYG builder with inline editing, drag-and-drop, undo/redo, auto-save, mobile interaction
- [ ] **Phase 5: Reference Data UX** - Company profile, customer management, product catalog with quick insert
- [ ] **Phase 6: Validation, Delivery & Polish** - Validation warnings, compliance checklist, PDF download/print, workspace backup/restore, complete dashboard

## Phase Details

### Phase 1: Foundation Spike

**Goal**: The two gatekeeping technical decisions (framework, PDF engine) are made against explicit criteria and proven on a realistic invoice, so every later phase builds on a validated foundation.
**Depends on**: Nothing (first phase — blocking; no other phase starts until this passes)
**Requirements**: (none — feasibility spike, no user-facing requirement)
**Success Criteria** (what must be TRUE):

  1. An ADR records the framework decision (Vite SPA + TanStack Router vs TanStack Start) with the deciding evidence, defaulting to Vite SPA per research consensus.
  2. An ADR records the PDF path decision (print-CSS primary vs react-pdf) decided against explicit criteria: Safari paged-media fidelity, per-page watermark positioning, rendering latency vs editing speed.
  3. A golden-image parity harness proves identical preview/output on fixture documents (long names, 12+ items, accented text, logo, watermark) and runs in dev and CI.
  4. The app scaffold (Vite SPA, TypeScript strict, Tailwind v4, shadcn/ui, TanStack Router, Dexie, vite-plugin-pwa) boots, deploys as static files, and has a green CI baseline.

**Plans**: 3/3 plans executed
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Tracer scaffold: Vite SPA + fixture invoice renders through one shared component + print CSS, green build

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Golden-image parity harness + committed baselines + ADR 0002 (PDF path)
- [x] 01-03-PLAN.md — ADR 0001 (framework) + CI baseline workflow

### Phase 2: Domain Core & Persistence

**Goal**: The document model, totals engine, and local persistence behave correctly with no user interface built yet — the parity contract every later phase consumes.
**Depends on**: Phase 1
**Requirements**: LINE-03, STOR-01, STOR-02, STOR-03, STOR-04
**Success Criteria** (what must be TRUE):

  1. Totals (subtotal, tax, shipping, fees, discount, grand total) are computed by one derived engine and never go out of sync across invoice, quote, and receipt document types (LINE-03).
  2. Money math uses integer minor units with per-currency decimals (JPY 0dp, EUR 2dp) and a single per-line rounding policy, verified by unit-test fixtures (supports LINE-03).
  3. Company profile, customers, product catalog, documents, and preferences persist in IndexedDB and survive a full page reload (STOR-01, STOR-02).
  4. A single document can be exported to JSON and imported back losslessly; malformed or schema-invalid imports are rejected at the boundary (STOR-03, STOR-04).

**Plans**: 4/4 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Tooling & CI gates: zod/vitest/fake-indexeddb install, test:unit script, CI unit gate

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Schema-first model + totals engine (LINE-03): types.ts restructure, money/totals, DocumentPage engine swap

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Persistence (STOR-01/02): Dexie version(2) five tables, repos, reload-survival spec
- [x] 02-04-PLAN.md — Import/export boundary (STOR-03/04): versioned envelope, structured rejection

### Phase 3: Render Pipeline

**Goal**: Documents render identically on screen and in PDF, controlled by style-only templates and branding — the product's core promise proven while rendering is cheap.
**Depends on**: Phase 2
**Requirements**: TEMP-01, TEMP-02, TEMP-03, BRND-01, BRND-02, BRND-03, BRND-04, BRND-05, BRND-06, BRND-07, PDF-01, PDF-02, PDF-03, PDF-04, PDF-05, PDF-06, BUIL-10
**Success Criteria** (what must be TRUE):

  1. User can render a document with any of the seven templates (Blank, Minimal, Modern, Corporate, Freelancer, Agency, Creative); switching templates changes typography/colors/borders/spacing/layout style only, never the document's structure (TEMP-01, TEMP-02, TEMP-03).
  2. User can apply branding — logo, primary and accent colors, fonts, header/footer style, Draft/Paid watermark — and see it reflected in the on-screen preview (BRND-01, BRND-02, BRND-03, BRND-04, BRND-05, BRND-06).
  3. PDF output is identical to the on-screen preview — A4 by default, optional page sizes, automatic pagination, print margins, high resolution, white page — with the golden-image parity harness running in dev/CI to catch any drift (PDF-01, PDF-02, PDF-03, PDF-04, PDF-05, PDF-06, BRND-07).
  4. User can open print preview from the builder and see pagination and styling matching the PDF output (BUIL-10).

**Plans**: 4/4 plans planned
**UI hint**: yes
Plans:
**Wave 1**

- [ ] 03-01-PLAN.md — Tracer: Minimal slice e2e (schema optional fields → token registry → pure resolver → CSS-variable render → parity) + demo seed & bench shell

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-02-PLAN.md — Fonts (geist-mono, source-serif-4) + six template token files + 3×3 header/footer presets + template gallery with D-10 re-resolution

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-03-PLAN.md — Branding panel (logo/colors/fonts/header/footer/watermark, D-01..D-04) + English fixture migration + 7-template parity loop + golden regeneration

**Wave 4** *(blocked on Waves 2-3 completion)*

- [ ] 03-04-PLAN.md — Named @page rules + A5/A3 page sizes + print-preview dialog (measure-and-slice, D-15) + dialog parity checks

### Phase 4: Editing UX

**Goal**: Users create and edit documents WYSIWYG with full structural control on desktop and mobile — the product's differentiator.
**Depends on**: Phase 3
**Requirements**: BUIL-01, BUIL-02, BUIL-03, BUIL-04, BUIL-05, BUIL-06, BUIL-07, BUIL-08, BUIL-09, LINE-01, LINE-02
**Success Criteria** (what must be TRUE):

  1. On desktop, the builder presents three panes — section outline/layers, live canvas, element properties — and the user edits content inline directly on the canvas (BUIL-01, BUIL-03, BUIL-06).
  2. User can reorder sections and line items by drag-and-drop; duplicate, delete, reorder, and collapse line items; and edit title, description, quantity, unit price, discount, tax, and optional image on each (BUIL-04, BUIL-05, LINE-01, LINE-02).
  3. User can undo and redo edits, and the document auto-saves as they work so a reload never loses recent edits (BUIL-07, BUIL-08).
  4. User can zoom the canvas (BUIL-09).
  5. On mobile, the builder uses bottom sheets, drawers, and a sticky live preview, and the same editing actions work with touch (BUIL-02).

**Plans**: TBD (refined during planning)
**UI hint**: yes

### Phase 5: Reference Data UX

**Goal**: Users maintain reusable company profile, customers, and product catalog that accelerate the five-minute document workflow.
**Depends on**: Phase 4
**Requirements**: COPR-01, COPR-02, CUST-01, CUST-02, CUST-03, CUST-04, CATL-01, CATL-02, CATL-03
**Success Criteria** (what must be TRUE):

  1. User maintains a single company profile with name, logo, signature, stamp, email, phone, website, address, registration number, tax/VAT IDs, bank details, and payment instructions (COPR-01, COPR-02).
  2. User can create, edit, delete, and search customers; store billing and shipping addresses, tax ID, and notes; and reuse a customer across documents (CUST-01, CUST-02, CUST-03, CUST-04).
  3. User maintains a product catalog — name, description, default price, default quantity, default tax, category, SKU, optional image — and can search, favorite, quick-insert, edit, and delete items (CATL-01, CATL-02, CATL-03).

**Plans**: TBD (refined during planning)
**UI hint**: yes

### Phase 6: Validation, Delivery & Polish

**Goal**: Users can validate, download/print, back up, and navigate a complete, trustworthy workspace — the shipping phase.
**Depends on**: Phase 4, Phase 5
**Requirements**: VALD-01, VALD-02, VALD-03, VALD-04, VALD-05, VALD-06, VALD-07, COMPL-01, COMPL-02, PDF-07, PDF-08, STOR-05, STOR-06, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):

  1. User is warned (never blocked) when company details, a customer, or payment details are missing, line items are empty, document numbers are duplicated, dates are invalid, or values are negative (VALD-01, VALD-02, VALD-03, VALD-04, VALD-05, VALD-06, VALD-07).
  2. User sees a compliance checklist covering invoice number, issue date, seller details, buyer details, currency, totals, tax fields, and payment information — guidance only, with no country-specific legal validation (COMPL-01, COMPL-02).
  3. User can download the generated PDF and print via the browser from a single print surface (PDF-07, PDF-08).
  4. User can export and import the full workspace as JSON (backup/restore), including stored images, alongside single-document export/import (STOR-05, STOR-06).
  5. User lands on a dashboard showing recent documents, customers, and products; search across all three; quick actions to start a new invoice, quote, or receipt; and local statistics (DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06).

**Plans**: TBD (refined during planning)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Spike | 3/3 | Complete    | 2026-08-07 |
| 2. Domain Core & Persistence | 4/4 | Complete    | 2026-08-08 |
| 3. Render Pipeline | 0/TBD | Not started | - |
| 4. Editing UX | 0/TBD | Not started | - |
| 5. Reference Data UX | 0/TBD | Not started | - |
| 6. Validation, Delivery & Polish | 0/TBD | Not started | - |
