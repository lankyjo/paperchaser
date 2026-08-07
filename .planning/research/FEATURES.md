# Feature Research

**Domain:** Browser-only, local-first invoice/quote/receipt document workspace
**Researched:** 2026-08-07
**Confidence:** HIGH (feature sets verified against official product pages of Zoho, Invoice Ninja, FreshBooks, SimpleInvoices, Invoice Simple; EU compliance verified against European Commission primary source and GOV.UK)

## Feature Landscape

### Table Stakes (Users Expect These)

Every competitor studied (Zoho Invoice, Invoice Ninja, FreshBooks, SimpleInvoices, Invoice Simple) ships these. Missing them = the product feels broken, not "minimal."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Line items (title, description, qty, unit price, discount, tax, image) | The core of any invoice; universal across all 5 competitors | MEDIUM | Shared engine must power invoice/quote/receipt identically (PRD §5, §6.7) |
| Totals math (subtotal, tax, shipping, fees, discount, grand total) | Invoicing software exists to do the math correctly; users don't hand-calculate | MEDIUM | Floating-point precision + display rounding + currency-aware formatting (SimpleInvoices markets "locale-aware formatting") |
| Document creation for invoice, quote, receipt | The product itself | HIGH | One shared engine; quote→invoice conversion is table stakes in this market (Zoho, Ninja, Invoice Simple all do it) |
| Unique document numbering | Universal best practice (Invoice Simple: "assign a unique number… #001 and count from there"); also a legal requirement (EU full invoice: "unique sequential number") | LOW | Auto-increment sequence, manual override, duplicate detection |
| Company profile (name, logo, contact, tax/VAT IDs, bank details, payment instructions) | Seller must identify itself; VAT invoice legally requires supplier name/address/VAT ID | MEDIUM | Single profile in v1 (PRD §6.4) — all competitors support one+ |
| Customer management (create/edit/delete/search/reuse, billing + shipping addresses) | Universal (Zoho contacts, Ninja clients, Invoice Simple customers); customer picker feeds every document | MEDIUM | Billing and shipping address formats matter for PDF layout (Zoho: "configure address format") |
| Product catalog / reusable items (price, tax, SKU, category, quick insert) | Universal: Ninja "product library populates invoices in one click", Zoho items with SKUs, Invoice Simple "saved line items" | MEDIUM | Quick-insert into line items is the payoff; favorites are a cheap add-on |
| Templates (multiple, style-only) | Universal: Invoice Simple 60+, Ninja 4 free/11 paid, Zoho gallery, SimpleInvoices "multiple templates" | MEDIUM | PRD §6.3: style only, never structure — this is a defensible simplification that keeps the engine single |
| Logo + brand colors | Universal even on free tiers (Ninja: logo+colors "on all plans including free"; Invoice Simple: color palette) | MEDIUM | PDF output must keep white page per PRD §6.8 |
| PDF generation (download + print) | The deliverable is a PDF; every competitor has it | HIGH | "Identical preview/output" (PRD §6.9) is the hard part — flagged for Phase 1 spike |
| Auto-save | Table stakes for any web app; mandatory in a local-first app where the browser is the database | MEDIUM | Debounced Dexie writes; crash-safe draft recovery |
| Undo/redo | Table stakes for a document editor; users make mistakes reordering/deleting rows | MEDIUM-HIGH | Must cover structural ops (drag, add, delete, duplicate) not just text; design into state store early (Zustand), not bolted on |
| Validation (missing company/customer, empty line items, dup number, bad dates, negative values, missing payment details) | Users expect errors surfaced before PDF/print (PRD §6.11) | MEDIUM | Blocking vs warning split: missing required fields block; compliance gaps warn |
| Print preview | Universal; browser print is how freelancers deliver without accounts | MEDIUM | Reuses the same render path as PDF |

### Differentiators (Competitive Advantage)

Where Paperchaser competes. Every item below aligns with the Core Value: *"professional print-ready document in under 5 minutes, true WYSIWYG, entirely offline in the browser."*

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| True WYSIWYG three-pane builder (canvas + element properties + section outline) | No competitor offers an editable canvas — Ninja's "real-time PDF preview" is a form with a preview pane, not a document you edit in place. This IS the product's reason to exist | HIGH | PRD §6.2 desktop layout; the document model and the render model must be the same object |
| Local-first, zero account, works offline (IndexedDB) | Zero signup friction + privacy-first positioning; every competitor requires an account and server (even "self-hosted" Ninja and SimpleInvoices need a deployed backend) | MEDIUM | The only product in the market that is genuinely client-only |
| JSON backup/restore (single doc + full workspace) | Competitors lock data in their cloud; portable, inspectable data is both a trust signal and the migration story | LOW-MEDIUM | PRD §6.10; document model must be cleanly serializable (also feeds undo snapshots) |
| Compliance guidance checklist | None of the 5 studied tools offer a pre-send compliance checklist (they provide tax fields, not guidance). EU Directive has a concrete required-field list we can encode cheaply | LOW-MEDIUM | PRD §6.12: guidance only, no country-specific legal validation; high trust value at low cost |
| Mobile-first builder (bottom sheets, drawers, sticky live preview) | Invoice Simple is mobile but form-based; a true mobile WYSIWYG canvas is rare | HIGH | PRD §3 mobile-first; must not be a desktop port |
| Quote → invoice → receipt lifecycle on one engine | Invoice Simple does estimate→invoice; full 3-way conversion (quote accepted → invoice → receipt) from one shared document is stronger and matches the freelancer workflow | MEDIUM | Core loop of the whole product (Invoice Simple's headline workflow) |
| Drag-and-drop section + line-item ordering | Ninja's "fully customizable designs" apply to desktop template CSS, not canvas DnD | MEDIUM | dnd-kit per PRD §7 |
| Branding depth: fonts, header/footer styles, accent color, signature/stamp | Zoho lets you restyle the item table; full brand control in a self-serve tool is rare | MEDIUM | PRD §6.8; watermark (Draft/Paid) is unique to us |
| Watermark (Draft/Paid) | Not offered by studied competitors; prevents accidental sending of drafts | LOW | Cheap, visible differentiator |
| Dashboard with local statistics | Competitor dashboards show revenue/aging (requires accounting data we deliberately don't track); our dashboard shows *documents*: drafts/paid/quotes/receipts — honest to the product | MEDIUM | PRD §6.1 |

### Anti-Features (Commonly Requested, Often Problematic)

Every competitor has converged into full accounting suites (FreshBooks: accounting/payroll; Zoho: expenses/projects/roles; Ninja: inventory/reports/P&L). That convergence is exactly why "document creation only" is a defensible niche — and why these must be rejected.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Payment processing / online payments (Stripe, PayPal, etc.) | "Get paid faster" is how Zoho/Ninja/FreshBooks all sell | Requires backend, PCI compliance, merchant accounts — violates the no-backend constraint; huge legal surface | Document only. User emails the PDF, collects payment themselves (v1). Note as future scope with a hard architectural flag |
| Accounting / expense tracking / payroll | "All-in-one" appeal; competitors all do it | Scope creep that erases the differentiation; FreshBooks/Zoho show the endpoint | None — deliberate PRD non-goal (§3 Non Goals) |
| Recurring invoices / auto-billing / payment reminders | Revenue automation | Requires background scheduling — impossible in a purely client-side app that may be closed | Manual duplicate; or future cloud/desktop scope |
| Customer portal / client-facing billing pages | Client convenience (Ninja "Billing.YourCompany.com") | Requires a hosted server — impossible local-first | Email the PDF; customer replies by email |
| Email sending (Gmail/SMTP) | Universal in competitors | Needs backend + OAuth + SMTP credentials; conflicts with no-backend | "Export PDF + mailto:" link; future cloud scope |
| Inventory management / stock levels | Ninja auto-reduces inventory on invoice | Out of scope (PRD non-goal); requires stock math and a whole product model | Product catalog only — no quantities on hand |
| Time tracking / projects / timesheets | FreshBooks/Zoho/Ninja all have it | Entirely separate domain; PRD non-goal | Line item hours typed manually |
| Team collaboration / multi-user roles | Competitors offer users+permissions | PRD non-goal; single-user local-first | None |
| e-Signature integration | Ninja/Zoho sell e-signing | Legal trust infrastructure + backend | Manual signature/stamp image embedded in the document |
| e-Invoicing / PEPPOL / structured XML (UBL, Factur-X) | EU 2025–2030 mandates are arriving; Visma is buying e-invoicing companies | Country-specific formats, huge complexity, constant regulation churn | Compliance checklist guidance only in v1 (PRD §6.12) |
| Custom template builder (design-your-own layout) | "Fully customizable designs" (Ninja) | Building a layout editor is a mini-DTP project; conflicts with "highly customizable without being overwhelming" (PRD §2) | Curated template set that controls style only (PRD §6.3); revisit for template marketplace (PRD §8) |

## Feature Dependencies

```
Document engine (shared model)
    ├──requires──> Line items
    │                  └──requires──> Totals math
    ├──requires──> Company profile
    ├──requires──> Customer picker
    │                  └──requires──> Customer management
    ├──requires──> Document number generator
    ├──requires──> Validation schema (Zod)
    │                  └──requires──> Compliance checklist
    └──requires──> Template renderer
                       └──requires──> Branding (colors/fonts/logo)

PDF generation ──requires──> Document engine (same render tree)
PDF parity ──requires──> WYSIWYG preview + PDF share the render model

Autosave ──requires──> Dexie persistence layer
Undo/redo ──requires──> Zustand state architecture (snapshot/command design, decided upfront)

JSON import/export ──requires──> Serialization of document engine (also enables undo snapshots)
Dashboard ──requires──> Document status field (draft/paid/sent)

Product catalog ──enhances──> Line items (quick insert)
Quote → invoice → receipt ──requires──> Shared engine + document type field
Mobile builder ──requires──> WYSIWYG builder (same component tree, different layout)
```

### Dependency Notes

- **Line items require totals math:** the totals block is derived state of the items — never stored independently, always computed. This is a Phase-1 decision that shapes everything.
- **PDF parity requires the render model be shared:** PRD §6.9 ("identical preview/output") forces the on-screen canvas and the PDF generator to consume the same document tree. This is the highest-risk dependency in the whole product and is flagged for the Phase 1 spike (react-pdf may strain at editing speed).
- **Undo/redo requires the state store to be designed for it:** you cannot bolt history onto an ad-hoc store. Snapshot or command-pattern decisions must be made when the builder is architected, not added later.
- **Templates control style only (PRD §6.3):** because templates never change structure, the document engine stays single and line-item/validation/compliance logic is shared across invoice, quote, and receipt. This is a deliberate constraint that keeps dependencies acyclic.
- **Compliance checklist depends on company profile + document fields:** required fields (unique number, date, seller/buyer details, VAT breakdown, currency, totals, payment info) are only checkable when both profile and document data exist.
- **Product catalog enhances line items:** quick-insert is the payoff; without the catalog the line items feature still works (typed manually), so catalog can ship a phase after line items.

## MVP Definition

### Launch With (v1)

Ruthless minimum to validate the Core Value (professional document in <5 min, offline, no account):

- [ ] Shared document engine (invoice + quote + receipt on one model) — the product's spine
- [ ] WYSIWYG canvas with inline editing + element properties panel — the differentiator
- [ ] Line items + computed totals (subtotal/tax/discount/grand total) — the math
- [ ] Company profile — mandatory for any professional output
- [ ] Customer management (create/search/reuse) — mandatory for any real invoice
- [ ] A small template set (Blank + Minimal + Modern is enough to prove style-only templating; full 7-template set is PRD scope)
- [ ] PDF generation (download) — the deliverable; print via browser
- [ ] Local persistence + autosave (Dexie) — the product doesn't work without it
- [ ] JSON export/import (workspace) — the backup story and trust signal
- [ ] Validation (blocking set only) — missing company/customer, empty line items, dup number, negative values
- [ ] Compliance checklist (guidance) — cheap trust win, PRD §6.12
- [ ] Undo/redo — table stakes for the editor
- [ ] Dashboard (basic: recent documents + quick actions + search; defer stats)

### Add After Validation (v1.x)

- [ ] Quote→invoice→receipt conversion — the lifecycle loop; needs document-type field + status model to be exercised in the wild first
- [ ] Product catalog + quick insert + favorites — add once line-item UX is proven
- [ ] Branding extras: watermark (Draft/Paid), signature/stamp, header/footer styles — polish layer
- [ ] Dashboard statistics (drafts/paid/quotes/receipts counts) — needs documents to exist before the numbers mean anything
- [ ] Drag-and-drop section/line-item ordering polish on touch — needs builder UX feedback
- [ ] Mobile builder refinements (bottom sheets, sticky preview) beyond the working base — needs real-device feedback
- [ ] Additional page sizes (US Letter etc.) — A4 first per PRD §6.9
- [ ] Validation warnings tier (missing payment details, incomplete tax fields) — after blocking validation ships

### Future Consideration (v2+)

- [ ] Template marketplace — revenue model candidate (PRD §8); requires template format stability
- [ ] Custom template builder — PRD §8; defer until template format is stable and users demand it
- [ ] Multiple company profiles — PRD §8; deferred because single-profile keeps the data model simple
- [ ] Cloud sync / authentication — PRD §8 but **conflicts** with the privacy-first local-first principle; requires explicit product decision, not just engineering
- [ ] Email integration — PRD §8; needs backend, revisit only if cloud sync is approved
- [ ] Credit notes / purchase orders — PRD §8; new document types on the shared engine, easy once engine is mature

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Document engine (shared) | HIGH | HIGH | P1 |
| WYSIWYG canvas builder | HIGH | HIGH | P1 |
| Line items + totals math | HIGH | MEDIUM | P1 |
| PDF generation + print | HIGH | HIGH | P1 |
| Company profile | HIGH | MEDIUM | P1 |
| Customer management | HIGH | MEDIUM | P1 |
| Local persistence + autosave | HIGH | MEDIUM | P1 |
| JSON import/export | HIGH | LOW | P1 |
| Validation (blocking) | HIGH | MEDIUM | P1 |
| Compliance checklist | MEDIUM | LOW | P1 |
| Undo/redo | HIGH | MEDIUM | P1 |
| Templates (style-only set) | HIGH | MEDIUM | P1 |
| Basic dashboard (recent + search) | MEDIUM | MEDIUM | P1 |
| Product catalog + quick insert | MEDIUM | MEDIUM | P2 |
| Quote→invoice→receipt conversion | MEDIUM | MEDIUM | P2 |
| Watermark / signature / stamp | LOW | LOW | P2 |
| Dashboard statistics | LOW | MEDIUM | P2 |
| DnD section/line-item ordering | MEDIUM | MEDIUM | P2 |
| Mobile builder polish (bottom sheets) | HIGH | HIGH | P2 (base is P1 per PRD mobile-first) |
| Additional page sizes | LOW | LOW | P3 |
| Template marketplace / custom builder | MEDIUM | HIGH | P3 |
| Cloud sync / email / multi-profile | MEDIUM | HIGH | P3 (requires product decision) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Zoho Invoice | Invoice Ninja | Invoice Simple | FreshBooks | Our Approach |
|---------|--------------|---------------|----------------|-----------|--------------|
| Doc types | Invoice, quote, receipt, credit note | Invoice, quote | Invoice, estimate, receipt | Invoice, estimate, proposal | Invoice, quote, receipt — one shared engine |
| Builder | Form + template preview | Form + real-time PDF preview | Mobile form | Form | True WYSIWYG editable canvas (differentiator) |
| Templates | Gallery, fully customizable | 4 free / 11 paid, customizable | 60+ | Few | Curated style-only set (7 per PRD); structure fixed |
| Line items | Yes | Yes, per-line tax | Yes + photos | Yes | Yes: title, description, qty, price, discount, tax, image, collapse |
| Products | Items + SKUs | Product library + inventory levels | Saved line items | Services/items | Catalog with category, SKU, favorites, quick insert — **no inventory** |
| Tax | Multi-level, per-country | Per-line inclusive/exclusive, auto-US sales tax | Sales tax | Auto-calc | Per-line tax; compliance guidance only, no legal validation |
| PDF | Yes | Yes, real-time preview | Yes | Yes | Yes + guaranteed preview/output parity (the hard requirement) |
| Storage | Cloud, accounts | Cloud or self-host backend | Cloud, accounts | Cloud, accounts | IndexedDB, zero account, offline (unique) |
| Backup | Export (partial) | API/export | Cloud sync | Cloud | Full workspace JSON export/import (differentiator) |
| Payments | 10+ gateways | Gateways + deposits + late fees | Cards, ACH, PayPal, Venmo | Yes | **No** — anti-feature for local-first |
| Recurring | Yes | Yes + auto-billing | No | Yes | **No** — impossible client-side |
| Email | Yes (email/WhatsApp/SMS) | Gmail/MSN/SMTP | Email/text | Yes | **No v1** — export PDF + mailto only |
| Compliance | Tax fields | Tax settings | None | Tax calc | Guidance checklist per EU required fields (differentiator) |

## Sources

- Zoho Invoice features page — https://www.zoho.com/invoice/features.html (verified 2026-08-07)
- Zoho Invoice create-send-invoices page — https://www.zoho.com/invoice/create-send-invoices/
- Invoice Ninja (commercial) — https://invoiceninja.com/ and invoicing features — https://www.invoiceninja.com/invoicing/
- Invoice Ninja (self-host, ELv2) — https://www.invoiceninja.org/
- FreshBooks homepage/product map — https://www.freshbooks.com/
- SimpleInvoices (GPLv3, open source since 2005) — https://simpleinvoices.org/
- Invoice Simple homepage — https://www.invoicesimple.com/ and features — https://www.invoicesimple.com/features/
- Invoice Simple: Invoice vs Receipt — https://www.invoicesimple.com/blog/invoice-vs-receipt/
- European Commission, VAT invoicing rules (EU Directive 2006/112/EC required invoice contents) — https://taxation-customs.ec.europa.eu/taxation/vat/vat-businesses/invoicing_en (verified 2026-08-07)
- GOV.UK, Charge, reclaim and record VAT — https://www.gov.uk/charge-reclaim-record-vat/charging-vat
- Source PRD — `/home/ikeji/Downloads/Invoice_Workspace_PRD_v1.md` (requirements base)
- Project context — `/mnt/storage/Documents/PERSONAL/paperchaser/.planning/PROJECT.md`

---
*Feature research for: Paperchaser — browser-only local-first invoice/quote/receipt workspace*
*Researched: 2026-08-07*
