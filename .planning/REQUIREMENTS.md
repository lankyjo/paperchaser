# Requirements: Paperchaser

**Defined:** 2026-08-07
**Core Value:** Create a professional, print-ready business document (invoice, quote, or receipt) in under five minutes with a true WYSIWYG editing experience, entirely offline in the browser.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases. Scope sourced from `Invoice_Workspace_PRD_v1.md` §6, informed by `.planning/research/FEATURES.md`.

### Dashboard

- [ ] **DASH-01**: User sees recent documents on the dashboard
- [ ] **DASH-02**: User sees recent customers on the dashboard
- [ ] **DASH-03**: User sees recent products on the dashboard
- [ ] **DASH-04**: User can start a new invoice, quote, or receipt via quick actions
- [ ] **DASH-05**: User can search documents, customers, and products
- [ ] **DASH-06**: User sees local statistics (total documents, drafts, paid, quotes, receipts)

### Document Builder

- [ ] **BUIL-01**: Desktop builder has three panes: left (sections/outline/layers), center (live canvas), right (element properties, styling, document settings)
- [ ] **BUIL-02**: Mobile builder uses bottom sheets, drawers, full-screen editors, and sticky live preview
- [ ] **BUIL-03**: User can edit the document live on the canvas (WYSIWYG)
- [ ] **BUIL-04**: User can reorder sections by drag-and-drop
- [ ] **BUIL-05**: User can reorder line items by drag-and-drop
- [ ] **BUIL-06**: User can edit content inline without leaving the canvas
- [ ] **BUIL-07**: User can undo and redo edits
- [ ] **BUIL-08**: Document auto-saves as the user works
- [ ] **BUIL-09**: User can zoom the canvas
- [ ] **BUIL-10**: User can open print preview from the builder

### Templates

- [ ] **TEMP-01**: Template set covers Blank, Minimal, Modern, Corporate, Freelancer, Agency, Creative
- [ ] **TEMP-02**: Templates control typography, colors, borders, spacing, and layout style
- [ ] **TEMP-03**: Applying a template never changes document structure

### Company Profile

- [ ] **COPR-01**: User maintains a single company profile
- [ ] **COPR-02**: Company profile supports name, logo, signature, stamp, email, phone, website, address, registration number, tax ID, VAT ID, bank details, payment instructions

### Customer Management

- [ ] **CUST-01**: User can create, edit, and delete customers
- [ ] **CUST-02**: User can search customers
- [ ] **CUST-03**: User can reuse a customer across documents
- [ ] **CUST-04**: Customer record supports name, company, email, phone, billing address, shipping address, tax ID, notes

### Product Catalog

- [ ] **CATL-01**: User maintains a catalog of reusable products/services
- [ ] **CATL-02**: Catalog item supports name, description, default price, default quantity, default tax, category, SKU, optional image
- [ ] **CATL-03**: User can search, favorite, quick-insert, edit, and delete catalog items

### Line Items & Totals

- [ ] **LINE-01**: Line item supports title, description, quantity, unit price, discount, tax, optional image
- [ ] **LINE-02**: User can duplicate, delete, reorder, and collapse line items
- [x] **LINE-03**: Totals (subtotal, tax, shipping, fees, discount, grand total) are computed correctly and never go out of sync

### Branding

- [ ] **BRND-01**: User can set a logo on the document
- [ ] **BRND-02**: User can set a primary brand color
- [ ] **BRND-03**: User can set an accent brand color
- [ ] **BRND-04**: User can choose fonts
- [ ] **BRND-05**: User can configure header/footer style
- [ ] **BRND-06**: User can apply a Draft or Paid watermark
- [ ] **BRND-07**: PDF output always renders on a white page

### PDF Generation

- [ ] **PDF-01**: PDF defaults to A4 page size
- [ ] **PDF-02**: User can select optional page sizes
- [ ] **PDF-03**: PDF paginates automatically across pages
- [ ] **PDF-04**: PDF renders at high resolution
- [ ] **PDF-05**: PDF respects print margins
- [ ] **PDF-06**: PDF output is identical to the on-screen preview
- [ ] **PDF-07**: User can download the PDF
- [ ] **PDF-08**: User can print via the browser

### Storage

- [ ] **STOR-01**: Data persists locally in IndexedDB via Dexie
- [ ] **STOR-02**: IndexedDB stores company profile, customers, product catalog, documents, and preferences
- [ ] **STOR-03**: User can export a single document as JSON
- [ ] **STOR-04**: User can import a single document from JSON
- [ ] **STOR-05**: User can export the full workspace as JSON
- [ ] **STOR-06**: User can import a workspace from JSON (backup/restore)

### Validation

- [ ] **VALD-01**: User is warned when company details are missing
- [ ] **VALD-02**: User is warned when a customer is missing
- [ ] **VALD-03**: User is warned when a document has empty line items
- [ ] **VALD-04**: User is warned on duplicate document numbers
- [ ] **VALD-05**: User is warned on invalid dates
- [ ] **VALD-06**: User is warned on negative values
- [ ] **VALD-07**: User is warned when payment details are missing

### Compliance

- [ ] **COMPL-01**: Compliance checklist covers invoice number, issue date, seller details, buyer details, currency, totals, tax fields, payment information
- [ ] **COMPL-02**: v1 provides compliance guidance only — no country-specific legal validation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Lifecycle & Currency

- **CONV-01**: User can convert a quote to an invoice and an invoice to a receipt
- **MONEY-01**: Multi-currency support with locale-aware formatting (per-currency decimal policy from first commit)
- **PGSZ-01**: Additional page sizes beyond A4 (e.g. US Letter)

### Future Scope (PRD §8)

- **AUTH-01**: User accounts and authentication
- **SYNC-01**: Cloud sync
- **MPROF-01**: Multiple company profiles
- **CRED-01**: Credit notes
- **PURC-01**: Purchase orders
- **MKTP-01**: Template marketplace
- **CTMP-01**: Custom template builder
- **COLL-01**: Team collaboration
- **MAIL-01**: Email sending integration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Accounting | PRD §1/§3 non-goal — document creation only |
| Inventory management | PRD §3 non-goal; catalog has no stock levels |
| Expense tracking | PRD §3 non-goal |
| CRM | PRD §3 non-goal |
| Payment processing / online payments | PRD §3 non-goal; requires backend + PCI — violates no-backend constraint |
| Recurring invoices / auto-billing | Impossible in a purely client-side app; requires background scheduling |
| Customer portal / client billing pages | Requires a hosted server — conflicts with local-first |
| Email sending (SMTP/Gmail) | Requires backend + OAuth — conflicts with no-backend |
| e-Signature integration | Legal trust infrastructure + backend |
| e-Invoicing / PEPPOL / structured XML | Country-specific formats and regulation churn; guidance-only in v1 |
| Team collaboration | PRD §3 non-goal; single-user local-first |
| Time tracking / projects / timesheets | PRD §3 non-goal; separate domain |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| DASH-03 | Phase 6 | Pending |
| DASH-04 | Phase 6 | Pending |
| DASH-05 | Phase 6 | Pending |
| DASH-06 | Phase 6 | Pending |
| BUIL-01 | Phase 4 | Pending |
| BUIL-02 | Phase 4 | Pending |
| BUIL-03 | Phase 4 | Pending |
| BUIL-04 | Phase 4 | Pending |
| BUIL-05 | Phase 4 | Pending |
| BUIL-06 | Phase 4 | Pending |
| BUIL-07 | Phase 4 | Pending |
| BUIL-08 | Phase 4 | Pending |
| BUIL-09 | Phase 4 | Pending |
| BUIL-10 | Phase 3 | Pending |
| TEMP-01 | Phase 3 | Pending |
| TEMP-02 | Phase 3 | Pending |
| TEMP-03 | Phase 3 | Pending |
| COPR-01 | Phase 5 | Pending |
| COPR-02 | Phase 5 | Pending |
| CUST-01 | Phase 5 | Pending |
| CUST-02 | Phase 5 | Pending |
| CUST-03 | Phase 5 | Pending |
| CUST-04 | Phase 5 | Pending |
| CATL-01 | Phase 5 | Pending |
| CATL-02 | Phase 5 | Pending |
| CATL-03 | Phase 5 | Pending |
| LINE-01 | Phase 4 | Pending |
| LINE-02 | Phase 4 | Pending |
| LINE-03 | Phase 2 | Complete |
| BRND-01 | Phase 3 | Pending |
| BRND-02 | Phase 3 | Pending |
| BRND-03 | Phase 3 | Pending |
| BRND-04 | Phase 3 | Pending |
| BRND-05 | Phase 3 | Pending |
| BRND-06 | Phase 3 | Pending |
| BRND-07 | Phase 3 | Pending |
| PDF-01 | Phase 3 | Pending |
| PDF-02 | Phase 3 | Pending |
| PDF-03 | Phase 3 | Pending |
| PDF-04 | Phase 3 | Pending |
| PDF-05 | Phase 3 | Pending |
| PDF-06 | Phase 3 | Pending |
| PDF-07 | Phase 6 | Pending |
| PDF-08 | Phase 6 | Pending |
| STOR-01 | Phase 2 | Pending |
| STOR-02 | Phase 2 | Pending |
| STOR-03 | Phase 2 | Pending |
| STOR-04 | Phase 2 | Pending |
| STOR-05 | Phase 6 | Pending |
| STOR-06 | Phase 6 | Pending |
| VALD-01 | Phase 6 | Pending |
| VALD-02 | Phase 6 | Pending |
| VALD-03 | Phase 6 | Pending |
| VALD-04 | Phase 6 | Pending |
| VALD-05 | Phase 6 | Pending |
| VALD-06 | Phase 6 | Pending |
| VALD-07 | Phase 6 | Pending |
| COMPL-01 | Phase 6 | Pending |
| COMPL-02 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 61 total
- Mapped to phases: 61
- Unmapped: 0 ✓

Note: Phase 1 (Foundation Spike) is a blocking feasibility spike and intentionally maps no requirements — it gates all other phases.

---
*Requirements defined: 2026-08-07*
*Last updated: 2026-08-07 after initial definition*
