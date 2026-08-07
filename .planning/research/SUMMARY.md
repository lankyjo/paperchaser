# Project Research Summary

**Project:** Paperchaser
**Domain:** Browser-only, local-first invoice/quote/receipt document workspace (WYSIWYG builder + client-side PDF)
**Researched:** 2026-08-07
**Confidence:** HIGH (all four research files verified against primary sources: npm registry, official docs for react-pdf/Dexie/Zustand/dnd-kit/vite-plugin-pwa/TanStack, 5 competitor sites, EU Commission/GOV.UK)

## Executive Summary

Paperchaser is a frontend-first, local-first document creation tool — no backend, no accounts, no server. All four research dimensions agree on the product's defining engineering problem: **the "identical preview/output" requirement (PRD §6.9) is the highest-risk decision in the product and must be resolved by a blocking Phase 1 spike before any editing UX is built.** The recommended architecture is *one pure serializable document model with two render projections* — an editable DOM canvas and a PDF output path — sharing the same style tokens, totals engine, and pagination policy. Everything else (Dexie persistence, Zustand state, style-only templates) exists to keep those two projections derived from one source of truth.

The research makes two opinionated corrections to the PRD's pinned stack, both validated in the Phase 1 spike with ADRs: **(1) drop TanStack Start and use Vite 8 SPA + TanStack Router** — Start is an RC-stage full-stack SSR framework whose own docs recommend Router alone when server features are not needed, and Paperchaser's whole premise is "no server"; **(2) make print-CSS the primary PDF path with @react-pdf/renderer as the evaluated fallback** — the WYSIWYG canvas must be HTML anyway, so rendering the *same* HTML via `@media print`/`@page` guarantees preview/output parity by construction, whereas react-pdf is a second layout engine that must be kept in sync forever (its own docs confirm Yoga+pdfkit, not browser CSS). The document model must be renderer-agnostic pure data under **both** paths — that is non-negotiable.

The main risks, all with concrete mitigations: PDF parity drift (mitigate with shared `resolveStyle` tokens + a screenshot-diff parity harness from Phase 3), IndexedDB data loss (Dexie versioning discipline from day one + JSON backup/restore as a table-stakes feature, never optional), undo/redo corrupted by async autosave (command-pattern/zundo temporal undo scoped to the document store only, persistence as a projection), mobile-first becoming desktop-only (edit-in-sheet + sticky-preview interaction design from day one, not responsive CSS), and money math (integer minor units + one per-line-rounding totals policy, never floats). Feature research confirms the MVP is well-defined and defensible: table stakes are broad but each is cheap on the shared engine; the differentiators (editable WYSIWYG canvas, zero-account offline, JSON backup, compliance checklist, 3-way document lifecycle) are exactly the product's reason to exist. The anti-feature list (payments, accounting, email, recurring billing, e-signing) is confirmed out of scope — each requires a backend that the core constraint forbids.

## Key Findings

### Recommended Stack

Vite 8 SPA + React 19 + TypeScript strict + TanStack Router + Tailwind v4 + shadcn/ui + TanStack Form + Zod 4 + Zustand (with zundo) + Dexie 4 (with dexie-react-hooks) + dnd-kit + vite-plugin-pwa + HugeIcons. **Two prescriptive overrides of the PRD pin:** TanStack Start → Vite SPA (Start needs a Node ≥22.12 server runtime for features explicitly out of scope; the swap is a spike decision with an ADR), and @react-pdf/renderer as *primary* → print-CSS primary with react-pdf as evaluated fallback (spike decides on Safari paged-media fidelity + per-page watermark positioning). All version peers verified against the npm registry today — see [STACK.md](STACK.md) for the full compatibility matrix and installation script.

**Core technologies:**
- **Vite 8** (SPA): standard for browser-only apps; deploys as static files; ecosystem default for shadcn/ui, Tailwind v4, TanStack Router, vite-plugin-pwa
- **React 19 + TypeScript (strict)**: current majors; the whole ecosystem declares React 19 peers; type-safe document model is the app's backbone (pin TS to latest 5.x if template tooling lags TS 7)
- **TanStack Router 1.x**: type-safe routes that honor the PRD's TanStack direction without the server half of Start
- **Tailwind v4 + shadcn/ui**: CSS-first styling (no config file) + open-code component system, editable for a highly customized builder
- **TanStack Form + Zod 4**: native Standard Schema support — pass Zod schemas directly; **never** use `@tanstack/zod-form-adapter` (pinned to Zod ^3, live trap)
- **Zustand + zundo**: slices-pattern stores; zundo temporal middleware for undo scoped to the document store only
- **Dexie 4 + dexie-react-hooks**: IndexedDB wrapper with schema versioning and live queries; `useLiveQuery` drives the dashboard with zero manual sync
- **dnd-kit**: SortableContext for line-item/section reorder; touch sensors for mobile
- **@react-pdf/renderer 4.5.1**: *only* if the spike rejects print-CSS; deterministic bytes but a second layout engine
- **vite-plugin-pwa**: Workbox offline; **use `registerType: 'prompt'`, never `autoUpdate`** (docs explicitly warn autoUpdate reloads tabs mid-edit and loses form data)

### Expected Features

The market is saturated with form-based invoicing tools that converged into accounting suites. Paperchaser's niche is validated: editable canvas + zero-account local-first. Feature research verified against Zoho Invoice, Invoice Ninja, FreshBooks, SimpleInvoices, Invoice Simple, plus EU Commission/GOV.UK for compliance. Full matrix in [FEATURES.md](FEATURES.md).

**Must have (table stakes — P1 for launch):**
- Line items (title, description, qty, price, discount, tax, image) + computed totals — the math, one shared engine for all 3 doc types
- Invoice/quote/receipt creation on one shared engine; unique document numbering (legal requirement in the EU)
- Company profile + customer management — mandatory for professional output
- Style-only templates + branding (logo, colors, fonts) — template set controls style, never structure (PRD §6.3)
- PDF generation + print preview — "identical preview/output" is the hard part
- Autosave (Dexie, debounced) + undo/redo — table stakes; undo must cover structural ops and be designed into the store from day one
- Blocking validation + compliance checklist (guidance-only, PRD §6.12)
- JSON export/import (workspace) — the only user-facing recovery from eviction; treat as core, not nice-to-have
- Basic dashboard (recent docs + search); defer stats

**Should have (differentiators — P2/v1.x):**
- True WYSIWYG three-pane builder (canvas + properties + outline) — the product's reason to exist, no competitor offers an editable canvas
- Local-first zero-account offline — the only genuinely client-only product in the market
- Quote → invoice → receipt lifecycle on one engine (stronger than competitors' estimate→invoice)
- Product catalog + quick insert + favorites
- Watermark (Draft/Paid), signature/stamp, header/footer styles
- Drag-and-drop section/line-item ordering; mobile builder polish (bottom sheets, sticky preview)
- Dashboard statistics; additional page sizes (US Letter) after A4

**Defer (v2+ / anti-features):**
- Payments, accounting/expenses, recurring billing, email sending, customer portal, e-signing, inventory, e-invoicing/PEPPOL — every one requires a backend and violates the core constraint; reject explicitly, note as future scope with hard architectural flags
- Template marketplace / custom template builder — needs a stable template taxonomy first
- Cloud sync — **conflicts** with the privacy-first principle; requires a product decision, not just engineering

### Architecture Approach

The canonical pattern for this product class is **"two projections, one model"**: an immutable, versioned, serializable `DocumentModel` (discriminated union over sections, `modelVersion` + migrations, uuid ids) is the single source of truth; a DOM canvas projection renders it editable, and a react-pdf (or print-CSS) projection renders it print-ready. Totals are **derived, never stored** (`computeTotals(model)`, one policy function); money is **integer minor units**; linked entities are **snapshots, not live references** (documents render forever and export self-contained); blobs live outside the model in a `files` table referenced by id. Templates are **style recipes keyed to a stable element taxonomy** — structure lives in the model only. Undo is zundo temporal middleware `partialize`d to the document slice (75-entry limit, throttled `handleSet`); Dexie is the single persistence authority (components never write the DB; a debounced `subscribeWithSelector` auto-save queue does). Full schema, store decomposition, PDF pipeline, and project structure in [ARCHITECTURE.md](ARCHITECTURE.md).

**Major components:**
1. **Document model + totals engine + template recipes** — pure domain core, zero React/Dexie imports, fully unit-testable; the parity contract both renderers consume
2. **Canvas projection** — `SectionRenderer` registry rendering the model into an editable A4-width page box, mirroring the PDF pagination policy via CSS break rules
3. **PDF pipeline** — `DocumentFactory` mapping model → react-pdf tree (or print-CSS), with `Font.register`, blob→base64 image resolver, worker boundary (`renderPdfInWorker`) built from day one
4. **Zustand stores** — `useDocumentStore` (document + zundo undo), `useReferenceStore` (profile/customers/products, no undo), `useUIStore` (panels/toasts); only the document store is undoable
5. **Persistence layer (Dexie)** — schema-first with `version().stores()`, repos, debounced auto-save, JSON import/export, workspace backup/restore; never index blobs or booleans
6. **PWA shell** — vite-plugin-pwa precaches the shell, `navigator.storage.persist()`, never caches IndexedDB data

### Critical Pitfalls

Top 5 of 12 (all primary-source verified, with phase mapping in [PITFALLS.md](PITFALLS.md)):

1. **PDF preview/output mismatch (two independent layout engines)** — canvas is HTML/CSS, PDF via a second engine (react-pdf's Yoga+pdfkit differs from browser CSS); parity dies. *Avoid:* one renderer-agnostic model; print-CSS primary path or render the actual react-pdf output; golden-image parity harness; decided in Phase 1 spike with ADR.
2. **react-pdf pagination breakage** — rows split mid-row, headers not repeated, known force-fit/overlap bug (#3449) at page bottoms. *Avoid:* rows `wrap={false}`, headers `fixed`, break-case fixture suite (3/7/12/40 items) with golden snapshots; if the engine can't deliver, switch to print-CSS.
3. **IndexedDB data loss / migrations** — editing shipped upgraders, silent index drops, browser eviction. *Avoid:* every schema change is a new `version(n)`, never modify a released upgrader; JSON backup/restore as core; migration tests on seeded fixture DBs; `storage.persist()`.
4. **Undo/redo corrupted by async autosave** — snapshot-granularity mismatch, redo not invalidated, undo resurrecting deleted content. *Avoid:* command/action-based undo on in-memory state; Dexie is a projection of the store, never drives it; redo-stack invalidation unit-tested; bounded history, not persisted.
5. **Zustand persist ordering + PWA autoUpdate** — async-hydration flash, shallow-merge clobbering nested model, `autoUpdate` reloading tabs mid-edit and losing form data (vite-plugin-pwa docs explicitly warn form apps). *Avoid:* Dexie as the only authority for document data; Zod-validated rehydration; hydration-gated rendering; **`registerType: 'prompt'` from day one** — migrating from autoUpdate later is documented as painful.

Also critical: **mobile-first quietly becoming desktop-only** (design edit-in-sheet + sticky-preview interaction, real-device QA, not responsive CSS), **currency/rounding errors** (per-line rounding policy, integer cents, per-currency decimals), **TanStack Start complexity** (cost pitfall taxing every phase — decide in spike), **duplicate-number handling** (warn-not-block, allocate at finalize in the save transaction, round-trip the counter on restore), **template corruption of structure** (snapshot styles into documents, never live template refs).

## Implications for Roadmap

The architecture research supplies a dependency-driven build order that all four files corroborate: **model/persistence → read-only rendering → editing → reference-data UX → validation → PDF delivery → PWA polish.** The FEATURES MVP priority matrix maps cleanly onto it, and each phase has explicit pitfalls to avoid.

### Phase 1: Foundation Spike (blocking — no other phase starts before it passes)
**Rationale:** The two open decisions — framework (TanStack Start vs Vite SPA) and PDF engine (print-CSS vs react-pdf) — gate every later phase. PDF parity is the product's core promise; the spike must prove it on a realistic invoice before any editing UX is built.
**Delivers:** ADR for framework choice (recommended: Vite SPA + TanStack Router); ADR for PDF path with explicit deciding criteria (a) Safari paged-media fidelity for repeating headers + mm margins, (b) per-page watermark positioning in print CSS, (c) react-pdf rendering latency vs editing speed; a golden-image parity harness skeleton on fixture docs (long names, 12+ items, accented text, logo, watermark); woff2 font registration + blob→base64-in-worker proof. Also: git init, scaffold, CI baseline.
**Addresses:** FEATURES "PDF generation + parity" and the two PRD "Keep stack" pending decisions.
**Avoids:** Pitfall 1 (two-engine split), Pitfall 2 (pagination breakage), Pitfall 12 (Start complexity).
**Research flag:** This is a *feasibility spike*, not a research pass — the deciding criteria are already explicit. Well-bounded.

### Phase 2: Domain Core + Persistence (pure logic, zero UI)
**Rationale:** Every later phase consumes the model and tables. The model rules (derived totals, snapshots, minor-unit money, style-only template constraint) must be encoded here or later phases retrofit corruption.
**Delivers:** `DocumentModel` types/factories/migrations; `computeTotals` + money/rounding/currency policy (per-line rounding, per-currency decimals); Dexie schema v1 + migration harness + open-failure UX; debounced auto-save queue; JSON import/export utils (Zod-validated at the boundary); validation schemas; document numbering model (allocate at finalize, counter round-trips).
**Uses:** TypeScript, Zod, Dexie, Zustand slices.
**Implements:** Domain core + persistence layers.
**Addresses:** Line items + totals, doc types, numbering, profile/customer model foundations (FEATURES P1).
**Avoids:** Pitfall 3 (data loss), Pitfall 4/5 (undo/persist authority decided now), Pitfall 8 (money), Pitfall 9 (numbering transaction), Pitfall 10 (template constraint).
**Research flag:** Standard, well-documented patterns (Dexie/Zustand/Zod) — skip research-phase. Requires migration-fixture and totals-policy unit tests in acceptance criteria.

### Phase 3: Render Pipeline (read-only viewer)
**Rationale:** The editor is an editor *of* a correct renderer — you cannot WYSIWYG against a broken projection. Parity must be proven while rendering is cheap and documents are small.
**Delivers:** `TemplateRecipe` registry + `resolveStyle` + theme-override merge (style-only, taxonomy-keyed); canvas `SectionRenderer` (read-only, A4 page boxes, pagination mirror via CSS break rules); PDF `DocumentFactory` + fonts + image resolver + worker boundary; **parity harness running in dev/CI** (screenshot diff canvas vs PDF on fixtures); basic dashboard (recent docs + search) as the thin app-shell slice; print preview.
**Uses:** React, Tailwind v4, TanStack Router routes, shadcn/ui primitives.
**Addresses:** Templates + branding, PDF generation, print preview, basic dashboard (FEATURES P1).
**Avoids:** Pitfall 1 (parity by shared tokens + harness), Pitfall 2 (break-case fixtures).
**Research flag:** Golden-image/screenshot-diff tooling choice (e.g., Playwright screenshots vs pixelmatch) deserves a mini-spike during phase planning; everything else standard.

### Phase 4: Editing UX (the differentiator)
**Rationale:** Editing depends on the Phase 3 renderer; this is where the product's reason to exist ships. Mobile interaction must be designed here as a first-class artifact, not ported later.
**Delivers:** Selection/zoom; inline editing + element properties panel; three-pane builder (outline/canvas/properties) desktop layout; dnd section + line-item ordering (drag handles, `touch-action: none`, PointerSensor delay+tolerance); zundo undo/redo wiring; auto-save wiring; mobile builder base (bottom sheets, sticky preview, `visualViewport` keyboard handling); 44px touch targets.
**Uses:** dnd-kit, zundo, Zustand, Tailwind.
**Addresses:** WYSIWYG canvas, drag-and-drop, undo/redo, mobile builder base (FEATURES P1 + PRD §3).
**Avoids:** Pitfall 4 (undo wired per architecture, not bolted on), Pitfall 6 (dnd touch/scroll/zoom), Pitfall 7 (mobile-first as a design artifact, real-device QA in acceptance).
**Research flag:** dnd-kit + inline-editing are standard patterns — skip research-phase. The **mobile interaction sub-spec** (PRD open question) is a design artifact this phase must produce; real mid-range Android/iOS device testing is mandatory.

### Phase 5: Reference Data UX
**Rationale:** Accelerators (customers/products) come after the core builder works — the "document in 5 minutes" loop needs the builder before the catalog.
**Delivers:** Company profile CRUD (single active profile); customer management (create/edit/delete/search/favorites, billing+shipping addresses); product catalog (price/tax/category/SKU/favorites/quick insert); snapshot-on-save wiring into documents; "refresh from catalog" action.
**Uses:** Dexie repos, TanStack Form, Zod.
**Addresses:** Company profile, customer management, product catalog (FEATURES P1/P2).
**Avoids:** Pitfall 3 (schema care), Pattern 4 (snapshot denormalization — refresh-from-catalog needs its own undo-safe action).
**Research flag:** Standard CRUD — skip research-phase.

### Phase 6: Validation + Compliance
**Rationale:** Users must see errors before PDF/print, but only the blocking tier blocks; compliance guidance is cheap trust (PRD §6.12).
**Delivers:** End-to-end validation flows (missing company/customer, empty line items, duplicate number **warn-not-block**, invalid dates, negative values); compliance checklist UI keyed by document kind; numbering helpers; validate-on-save/blur (never per-keystroke).
**Addresses:** Blocking validation + compliance checklist (FEATURES P1).
**Avoids:** Pitfall 9 (warn-not-block, transactional allocation).
**Research flag:** Standard — skip research-phase.

### Phase 7: PDF Delivery + Print
**Rationale:** Download/print are trivial once the DocumentFactory exists; workerization is mechanical behind the Phase 3 boundary; this completes the §6.9 promise.
**Delivers:** Download (`.pdf`); browser print via the generated PDF (hidden iframe + `print()` — never a second print surface); Web Worker offload for long docs; watermark (Draft/Paid) as a template-rendered element in both projections; print-margin verification in Chrome **and** Safari.
**Uses:** react-pdf (or print-CSS per spike), worker boundary.
**Addresses:** PDF download + print + watermark (FEATURES P1/P2, PRD requirement).
**Avoids:** Pitfall 2 (break cases shipped to golden tests), Pattern 8 (worker boundary already in place).
**Research flag:** Skip research-phase — mechanical; keep the parity harness running on the final delivery path.

### Phase 8: PWA + Polish
**Rationale:** Wraps an app that already works online; its failures are data-loss failures, so it goes last with a hard gate.
**Delivers:** PWA manifest + offline boot + `storage.persist()`; **`registerType: 'prompt'`** + update banner; workspace backup/restore UX (blobs in base64, merge policy on restore-into-existing-data); dashboard statistics; empty states/first-run onboarding; mobile refinement.
**Addresses:** Offline/PWA, backup/restore UX, dashboard stats (FEATURES P1/P2).
**Avoids:** Pitfall 11 (autoUpdate data loss, stale SW, schema mismatch across tabs).
**Research flag:** **Mini-spike:** backup/restore of a workspace with the `files` table (base64 blobs in JSON, size/edge cases, restore merge policy). Hard gate: PWA update flow must be QA'd with a v1→v2 schema migration in place.

### Phase Ordering Rationale
- **Spike first, everything else gated:** the framework and PDF-engine decisions are prerequisites for scaffolding and render design; the spike is the cheapest place to fail.
- **Domain core before rendering:** model/totals/templates must be pure and stable before two projections consume them — this is what makes parity enforceable instead of hopeful.
- **Read-only rendering before editing:** you cannot WYSIWYG against a broken projection; the parity harness goes live while rendering is cheap.
- **Editing before reference-data UX:** the core value ("professional document in <5 min") needs the builder before accelerators like customers/products.
- **Validation after editing, before delivery:** users must see errors before PDF/print; guidance-only compliance keeps it cheap.
- **PDF delivery late:** trivial once the DocumentFactory exists; watermark is render-time, not post-processing.
- **PWA last:** it touches the same persistence as everything else and its failure mode is data loss; `prompt`-strategy and migration-QA are hard gates.
- **Feature priority cross-check:** every FEATURES P1 item lands by Phase 6; P2 items land in Phases 4–8; anti-features never ship.

### Research Flags
Needs focused research/design during planning:
- **Phase 1:** feasibility spike (PDF parity harness, framework ADR) — criteria explicit, well-bounded; this is the only genuinely blocking research
- **Phase 3:** golden-image diff tooling selection (mini-spike)
- **Phase 8:** blob-in-JSON backup/restore edge cases (mini-spike); PWA update-flow QA methodology
- **Phase 4:** mobile interaction sub-spec is a design artifact, not research — but must be produced before implementation

Standard patterns (skip research-phase):
- **Phase 2** (Dexie/Zustand/Zod standard), **Phase 5** (CRUD), **Phase 6** (validation UX), **Phase 7** (mechanical once Phase 3 exists)
- **Phase 4 implementation** (dnd-kit + inline editing) — low risk once the mobile design artifact exists

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions/peer-compat verified against npm registry + official docs today (STACK.md). The two recommendations (drop Start, print-CSS primary) are reasoned judgments awaiting the Phase 1 spike — HIGH on facts, MEDIUM-HIGH on the overrides |
| Features | HIGH | Verified against 5 competitor product pages + EU Commission/GOV.UK primary sources (FEATURES.md) |
| Architecture | HIGH | Established patterns (two-projection render, derived state, snapshots); MEDIUM specifically on the react-pdf parity path — the flagged spike question |
| Pitfalls | HIGH | All primary-source verified incl. open GitHub issue #3449 and vite-plugin-pwa's explicit autoUpdate data-loss warning (PITFALLS.md) |

**Overall confidence:** HIGH — the only genuinely uncertain items are the two Phase 1 spike decisions, which the research has converted into falsifiable tests with explicit pass/fail criteria.

### Gaps to Address

- **PDF engine decision (print-CSS vs react-pdf):** unresolved by design — the spike decides on (a) Safari paged-media fidelity, (b) per-page watermark positioning, (c) editing-latency. *Handle:* keep the document model renderer-agnostic regardless; spike acceptance criteria are explicit in STACK.md §PDF.
- **Framework decision (Start vs Vite SPA):** unresolved by design — spike decides with ADR. *Handle:* default to Vite SPA + TanStack Router per STACK/PITFALLS consensus.
- **Exact mobile interaction patterns (PRD open question):** not researched (it is a design problem, not a research problem). *Handle:* Phase 4 produces a mobile interaction sub-spec; real-device QA in acceptance criteria.
- **Supported currencies at launch (PRD open question):** totals policy must support per-currency decimals (JPY 0dp, EUR 2dp) from the first commit regardless of the launch list.
- **Exact v1 template count (PRD says 7):** FEATURES says Blank/Minimal/Modern proves the style-only concept. *Handle:* taxonomy stability matters more than count; keep recipes as pure JSON to keep the future marketplace open.
- **Template snapshot vs live-reference (Pitfall 10):** must be resolved in Phase 2 (model constraint), not deferred to the template phase.
- **TypeScript 7 native compiler may lag template tooling:** pin to latest 5.x if scaffolding fails.
- **Accessibility acceptance criteria (PRD open question):** not researched; define during planning.
- **Product name:** still pending (Paperchaser working title) — cosmetic, does not block roadmap.

## Sources

### Primary (HIGH confidence)
- **npm registry** (`registry.npmjs.org`) — exact versions + peerDependencies for the full stack, fetched 2026-08-07 (STACK.md)
- **react-pdf v4 official docs** — components, advanced (page wrapping, `wrap`/`break`/`fixed`, orphan/widow, worker guidance), rendering process (Yoga + pdfkit, async font fetch); **GitHub issue #3449** (force-fit/overlap, open) (ARCHITECTURE.md, PITFALLS.md)
- **Dexie.js official docs** — versioning rules, index-drop semantics, transaction auto-commit; no-blob/no-boolean indexing warnings (ARCHITECTURE.md, PITFALLS.md)
- **Zustand v5 docs + Zundo README** — persist middleware (async hydration, shallow merge, Zod recommendation), temporal middleware API, production users (ARCHITECTURE.md, PITFALLS.md)
- **dnd-kit official docs** — PointerSensor, `touch-action: none`, activation constraints, drag-handle pattern (PITFALLS.md)
- **vite-plugin-pwa official docs** — autoUpdate data-loss warning for form apps, `prompt` recommendation, migration difficulty (PITFALLS.md)
- **TanStack Start official docs** — RC status, SSR-only model, "consider TanStack Router alone" guidance, Node ≥22.12 requirement (STACK.md, ARCHITECTURE.md, PITFALLS.md)
- **MDN** — storage quotas and eviction criteria, Safari behavior (PITFALLS.md)
- **Zoho Invoice, Invoice Ninja, FreshBooks, SimpleInvoices, Invoice Simple** product pages — feature landscape, verified 2026-08-07 (FEATURES.md)
- **European Commission VAT invoicing rules + GOV.UK** — EU required invoice contents for the compliance checklist (FEATURES.md)

### Secondary (MEDIUM confidence)
- PDF-parity analysis (print-CSS vs react-pdf vs rasterize vs headless) — derived from primary-source mechanics + ecosystem knowledge; the deciding spike confirms (STACK.md, ARCHITECTURE.md)
- Domain practice (currency rounding, warn-not-block numbering, editor command architecture, snapshot templates) — established industry patterns from editor frameworks and invoicing software, not primary-source cited (PITFALLS.md)

### Tertiary (LOW confidence)
- None — no single-source or inference-only claims required roadmap decisions; the two open items are explicitly converted into spike tests rather than asserted.

---
*Research completed: 2026-08-07*
*Ready for roadmap: yes*
