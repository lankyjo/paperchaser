# Architecture Research

**Domain:** Browser-only, local-first invoice/quote/receipt document workspace
**Researched:** 2026-08-07
**Confidence:** HIGH (patterns), MEDIUM (react-pdf parity path — flagged for Phase 1 spike)

## Standard Architecture

### System Overview

The defining architectural decision of this product class is: **one serializable document model, two pure render projections** (an editable DOM canvas and a react-pdf document). Everything else — store, persistence, templates, totals — exists to keep those two projections derived from the same source of truth, because the PRD's "identical preview/output" (§6.9) is only achievable when both renderers consume identical data and identical style/pagination policy.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        UI LAYER (components)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Dashboard │  │ Builder   │  │ Customers │  │ Products  │  │ Settings│  │
│  │ (list/    │  │ 3-pane:   │  │ CRUD +    │  │ catalog + │  │ profile │  │
│  │  search)  │  │ outline / │  │ search    │  │ quick     │  │ prefs   │  │
│  │           │  │ canvas /  │  │           │  │ insert    │  │         │  │
│  │           │  │ properties│  │           │  │           │  │         │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘  │
├────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────┤
│                   STATE LAYER (Zustand stores + actions)                  │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌────────────────────┐   │
│  │ useDocumentStore  │  │ useReferenceStore     │  │ useUIStore         │   │
│  │ (with zundo       │  │ profile/customers/    │  │ panels, sheets,    │   │
│  │  temporal undo)   │  │ products/preferences  │  │ toasts, selection  │   │
│  └────────┬─────────┘  └──────────┬───────────┘  └─────────┬──────────┘   │
├───────────┴───────────────────────┴────────────────────────┴──────────────┤
│                       DOMAIN CORE (pure, side-effect free)                │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────────────┐   │
│  │ Document model │  │ Totals engine  │  │ Template recipes (style only) │  │
│  │ types/validators│  │ computeTotals  │  │ + theme overrides            │  │
│  └───────┬───────┘  └───────────────┘  └──────────────┬───────────────┘   │
├──────────┴────────────────────────────────────────────┴───────────────────┤
│                  RENDER PROJECTIONS (two consumers, one source)           │
│  ┌─────────────────────────────┐     ┌────────────────────────────────┐   │
│  │ CANVAS (DOM, editable)      │     │ PDF (react-pdf, paginated)     │   │
│  │ SectionRenderer components  │     │ DocumentFactory → primitives   │   │
│  │ manual pagination mirror    │     │ wrapping engine + fixed/break  │   │
│  │ inline editing, selection   │     │ fonts, blobs→dataURI, worker   │   │
│  └─────────────┬───────────────┘     └───────────────┬────────────────┘   │
│                │  shared style tokens + pagination policy + totals        │
├────────────────┴──────────────────────────────────────────────────────────┤
│                      PERSISTENCE LAYER (Dexie / IndexedDB)                │
│  documents · companyProfiles · customers · products · preferences · files │
│  repos + auto-save (debounced) + JSON import/export + workspace backup    │
└───────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Document model | Typed, versioned, serializable document structure (sections, line items, snapshots, template ref). Source of truth for BOTH render paths. | Plain TS discriminated unions; Zod schema; `documentFactories[kind]` per invoice/quote/receipt; `modelVersion` + `migrate()` |
| Totals engine | Compute subtotal, tax, shipping, fees, discount, grand total from line items + overrides. Single money/rounding/currency policy. | Pure functions `computeTotals(model, ctx)`; never stored in model (derived); zero deps on React/Dexie |
| Template system | Style recipes keyed to a stable section/element taxonomy. Never touches structure. | `TemplateRecipe` interface (palette, type scale, spacing, borders, header/footer variants); theme overrides merge over recipe |
| Canvas projection | Renders model into editable on-page preview; mimics print layout; inline editing, selection, dnd. | React components per section (`SectionRenderer`), reusing the template recipes; CSS page boxes with break rules mirroring PDF policy |
| PDF pipeline | Renders model to A4/other-size paginated PDF identical to canvas; download + browser print. | `DocumentFactory` mapping model→react-pdf primitives; `Font.register`; `usePDF`/`pdf().toBlob()`; Web Worker for long docs |
| Document store | Current document + edit session; undo/redo; selection/zoom/dirty flags. | Zustand + `zundo` temporal middleware (`partialize` to doc model only, `limit` ~50, `handleSet` throttle) |
| Reference stores | Company profile, customers, products, preferences in memory; no undo; feeds snapshots into documents. | Zustand slices; hydrated from Dexie on boot; written through on mutation (`useLiveQuery` optional) |
| Persistence layer | IndexedDB schema, CRUD repos, debounced auto-save, JSON export/import, workspace backup/restore. | Dexie 4; repo modules wrapping tables; `subscribeWithSelector` on document store → save queue |
| Validation service | Structural validation (empty line items, negative values, duplicate doc numbers, dates) + compliance checklist. | Zod schemas per model + `validateDocument()`; compliance = guidance-only list keyed by document kind |
| PWA shell | Offline boot, precached shell, manifest, storage persistence. | vite-plugin-pwa (Workbox precache); `navigator.storage.persist()`; never caches IndexedDB itself |

## Core Architecture Decision: Two Projections, One Model

The single most consequential choice in this domain is how the editable canvas and the PDF stay identical. Three strategies exist:

1. **PDF-as-preview** (render react-pdf into `PDFViewer` and edit "around" it) — true parity by construction, but you cannot inline-edit inside a PDF iframe. Kills the PRD's "live editing / inline editing" (§6.2). **Rejected.**
2. **Single DOM path + print CSS** (canvas IS the output; browser print/CSS `@page`) — good WYSIWYG, but produces lower-quality PDFs than a dedicated engine and the PRD pins `@react-pdf/renderer`. **Rejected.**
3. **Two projections, one model** (DOM canvas for editing + react-pdf for output, both derived from the same model with shared style tokens, totals, and pagination policy) — recommended, with parity enforced by a **continuous parity harness** (render both paths and diff screenshots), because react-pdf's layout engine (Knuth–Plass text breaking, its own wrapping) will never be byte-identical to CSS. Parity is a process, not a property.

**Why this is the right call:** react-pdf builds PDFs from React primitives with its own layout engine — there is no HTML/CSS rendering path, so "the same CSS renders both" is impossible [verified: react-pdf docs]. The DOM canvas gives true WYSIWYG editing; the PDF gives professional output. The cost is that pagination, text flow, and page-break decisions must be *coordinated*, not shared. The mitigation is (a) shared declarative style tokens and page-break policy, (b) manual pagination mirroring in the canvas, (c) a screenshot-diff harness run continuously from Phase 3 onward. This is exactly the risk PROJECT.md flags; the Phase 1 spike must prove (b)+(c) on a realistic invoice before any editing UX is built.
## Document Data Model

A versioned, serializable, discriminated-union model. Invoice, quote, and receipt are **the same structure** — only the *default section set*, *doc fields*, and *validators* differ. One engine, three factories.

```typescript
// src/features/documents/model/types.ts
interface DocumentModel {
  modelVersion: 1;                       // migrations for schema evolution
  id: string;                            // uuid (stable across import/export)
  kind: 'invoice' | 'quote' | 'receipt';
  docNumber: string;
  issueDate: string;                     // ISO date
  dueDate?: string;                      // invoices/quotes
  currency: string;                      // ISO 4217
  status: 'draft' | 'sent' | 'paid' | 'void';
  templateId: string;                    // style recipe — structure untouched
  theme: ThemeOverrides;                 // branding: colors, fonts, watermark
  page: PageSettings;                    // size (A4 default), orientation, margins
  sections: Section[];                   // ordered, typed, reorderable
  metadata: { createdAt: string; updatedAt: string; rev: number };
}

type Section =
  | { type: 'header';    content: HeaderContent }                 // logo/title block
  | { type: 'company';   company: CompanySnapshot }               // seller (snapshot)
  | { type: 'customer';  customer?: CustomerSnapshot }            // buyer (snapshot)
  | { type: 'lineItems'; items: LineItem[] }                      // the table
  | { type: 'totals';    overrides?: TotalsOverrides }            // e.g. manual discount lines
  | { type: 'notes';     text: string }
  | { type: 'footer';    content: FooterContent };

interface LineItem {
  id: string;              // stable id for dnd/selection/undo
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;       // stored in minor units (cents) — see money policy
  discount?: { type: 'percent' | 'amount'; value: number };
  taxRate: number;         // e.g. 0.21 for 21%
  imageFileId?: string;    // reference into the files blob store — never inline
}
```

**Model rules (opinions):**

1. **Totals are derived, never stored.** `computeTotals(model)` produces subtotal/tax/shipping/fees/discount/grand total at render time. This eliminates the classic "totals out of sync" bug class. Only *overrides* (manual discount/shipping/fee line entries) live in the model; the engine merges them.
2. **Snapshots, not live references.** Documents embed a denormalized `CompanySnapshot`/`CustomerSnapshot` captured at save time (linked entity id also kept for "refresh from catalog"). Documents must render correctly forever and JSON export must be self-contained — even if the customer or profile is later edited/deleted. This is the local-first equivalent of a foreign-key snapshot.
3. **Money as minor units (integers).** Store quantities/prices as integer minor units (or a decimal library) to make totals exact and JSON-stable. Float arithmetic in totals is a compliance bug.
4. **Sections are an ordered array.** Enables drag-reorder, per-section visibility, and future custom layouts, while each document kind declares a *required skeleton* (invoice must contain header/company/lineItems/totals; missing sections are caught by validation, not by the type system).
5. **File payloads live outside the model.** Logo, signature, stamp, line-item images are blob records in a `files` table referenced by id. The model stays small, JSON export stays readable, and Dexie stays fast (never index blobs [verified: Dexie docs]).

## State Management with Undo/Redo

Zustand with the **slices pattern**; undo/redo via the `zundo` temporal middleware — Zustand has no built-in undo [verified: zustand README], and zundo is the de-facto standard (used by Dify, Alibaba x-render, Stability AI StableStudio [verified: zundo repo]).

**Store decomposition (why separate stores):**

| Store | Contents | Undo? | Persist? |
|-------|----------|-------|----------|
| `useDocumentStore` | current `DocumentModel`, selection, zoom, dirty flag, active doc id | **yes** (zundo) | via auto-save (Dexie) |
| `useReferenceStore` | company profile, customers, products, preferences (in-memory catalog) | no | direct Dexie write on mutation |
| `useUIStore` | panel open states, mobile sheet state, toasts, dialogs | no | no |

Separation matters because (a) document undo history must **never** capture catalog edits or UI toggles, and (b) catalog updates must not re-render the canvas. The document store is the only one wrapped in `temporal`.

**Undo configuration (document store):**

```typescript
// src/features/documents/store/documentStore.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';

const useDocumentStore = create<DocumentState>()(
  temporal(
    immer((set, get) => ({
      document: null,
      selection: null,
      zoom: 1,
      updateModel: (patch) => set((s) => { patch(s.document!); }),   // immer: structural sharing
      // ...actions
    })),
    {
      // Track ONLY the document model — UI state excluded from history.
      partialize: (s) => ({ document: s.document }),
      // 50–100 entries caps memory; docs are objects with arrays, not cheap.
      limit: 75,
      // Skip no-op snapshots (e.g. cursor moves that touch state).
      equality: shallow,
      // Coalesce high-frequency sets (typing in a field) into single history entries.
      handleSet: throttle((setFn) => setFn(), 500),
    },
  ),
);
```

**Rules:** every mutation goes through store actions (never direct mutation); immer gives structural sharing so a 200-line-item document stays cheap to copy; `undo()`/`redo()` are pure in-memory state swaps that then trigger auto-save through the normal subscription. **Undo history is intentionally not persisted across sessions** — IndexedDB auto-save already gives crash recovery of current state; persisting history blobs wastes storage and surprises users. JSON export/import restores the document, not its history.

## IndexedDB Schema (Dexie)

Schema-first with the Dexie `version().stores()` framework; migrations for every later version. **Index only what you query** — and never index blobs, booleans (Dexie cannot index booleans — model as 0/1), or huge strings [verified: Dexie docs].

```typescript
// src/features/persistence/db.ts
export const db = new Dexie('paperchaser');
db.version(1).stores({
  documents:        'id, kind, status, updatedAt, createdAt, [kind+updatedAt]',
  companyProfiles:  'id, isActive',                     // singleton row; isActive: 0/1
  customers:        'id, name, company, updatedAt, fav', // fav: 0/1, not boolean
  products:         'id, name, category, sku, updatedAt, fav',
  preferences:      'key',                               // settings KV
  files:            'id, sha, type, size',               // blobs stored, NOT indexed
});
```

| Table | Key | Purpose / queries | Notes |
|-------|-----|-------------------|-------|
| `documents` | `id` (uuid) | dashboard lists by kind/status, "recent" by `updatedAt`, search | uuid (not `++id`) so import/export and cross-device restore keep ids stable; `rev` counter for last-write-wins cross-tab |
| `companyProfiles` | `id` | single active profile; future multiple profiles | snapshot into documents at save |
| `customers` | `id` | search by name/company, favorites | `name`/`company` indexes feed prefix search; store normalized searchable name too if case-insensitive search needed |
| `products` | `id` | catalog search, category filter, SKU lookup | `sku` unique (`&sku`) only if SKUs are guaranteed unique |
| `preferences` | `key` | currency, locale, default template, page defaults | KV store — cheap to extend |
| `files` | `id` | blobs for logo/signature/stamp/item images | `sha` index enables dedupe (same logo reused in many docs); resolved to base64 data URI at PDF render time |

**Auto-save flow:** `subscribeWithSelector` on the document store's `document` slice → debounce (~800ms) → `db.documents.put(currentModel)`. Every mutating action already bumped `updatedAt`/`rev` inside the model, so saves are idempotent. Cross-tab conflicts: compare `rev` on write; warn-and-reload on `storage`/`visibilitychange` event when the other tab has a newer rev (v1 is last-write-wins with a warning — no merge UI).

## Template / Style System

**Templates control style only — structure is inviolable** (PRD §6.3). Enforce this structurally: the template type system literally cannot express section insertion/deletion/ordering; it can only parameterize rendering.

```typescript
// src/features/documents/templates/types.ts
interface TemplateRecipe {
  id: 'blank' | 'minimal' | 'modern' | 'corporate' | 'freelancer' | 'agency' | 'creative';
  palette: { primary: string; accent: string; text: string; muted: string; bg: string; pageBg: 'white' };
  typeScale: { heading: FontSpec; subheading: FontSpec; body: FontSpec; small: FontSpec };
  spacing: { pagePadding: string; sectionGap: string; rowGap: string };
  rules: {
    borders: BorderStyle;                 // table row rules, section dividers
    headerVariant: 'logo-left' | 'centered' | 'band';
    footerVariant: 'simple' | 'bordered' | 'watermark';
    totalsAlign: 'right' | 'left';
  };
  fonts: { family: string; weights: number[]; woff2Path: string };  // bundled, offline
}
```

**How parity is guaranteed here:** both the canvas `SectionRenderer` and the PDF `DocumentFactory` resolve styles through the **same recipe lookup** — `resolveStyle(templateId, themeOverrides, elementKey)` — and the PDF factory copies the resolved tokens (colors, sizes, spacing) into react-pdf `StyleSheet` objects. One function, two consumers. The `elementKey` taxonomy (header/company/customer/lineItems/totals/notes/footer and their sub-elements) is the contract the recipes are written against; templates added later must produce that taxonomy, so the canvas and PDF never diverge per-template.

Document-level `theme` overrides (branding colors/fonts/watermark) merge **over** the template recipe at render time. Watermark (Draft/Paid) is a template-rendered element (fixed, rotated, semi-transparent) in both projections, never a post-processed PDF overlay — keeps preview/output identical.

## PDF Generation Pipeline

```
model + theme + template ──► DocumentFactory ──► react-pdf <Document>
                                                    │
                    Font.register (bundled woff2) ──┤
                    files: blob → base64 dataURI ──►┤
                    shared pagination policy ──────►┤
                                                    ▼
                                    usePDF / pdf(doc).toBlob()
                                          │            │
                                  worker for ≥30p   download/print
```

1. **Mapping layer:** `DocumentFactory(model)` returns a `<Document>` tree. Sections map 1:1 to react-pdf primitives; the line-items table is nested `View`s (react-pdf has no table primitive); the totals block is a derived `computeTotals()` output rendered with the recipe's `totalsAlign`.
2. **Pagination:** react-pdf's built-in wrapping engine handles auto pagination. Use `fixed` for repeating header/footer/page numbers (with `render={({ pageNumber, totalPages }) => ...}` for `"1 / 3"`), `break`/`wrap={false}` for forced breaks, and `orphans`/`widows`/`minPresenceAhead` so headings never strand at page bottoms [verified: react-pdf docs]. **The canvas mirrors this policy** via CSS `break-inside: avoid`, `break-before: page`, and its own `minPresenceAhead` equivalent (a heading at the bottom of a page box pulls to next page). The page-break policy is one declarative module consumed by both, not duplicated logic.
3. **Fonts:** register bundled woff2 with `Font.register`; await registration before rendering. Bundling (not Google Fonts) is mandatory anyway for offline/PWA.
4. **Images:** IndexedDB blobs → base64 data URI at render time (robust in worker contexts, unlike `blob:` URLs). Logo, signature, stamp, item images all go through one `resolveImage(fileId)` helper.
5. **Delivery:** `usePDF` hook or imperative `pdf(doc).toBlob()` for download; **browser print prints the generated PDF** (hidden iframe + `print()`), because printing the PDF is the parity-safe path — a separate CSS `@page` print surface is a second renderer that can drift.
6. **Worker:** react-pdf docs recommend rendering documents of 30+ pages in a Web Worker to avoid blocking the main thread [verified]. Architect the `renderPdfInWorker(model)` boundary from day one even though v1 docs will be 1–5 pages — wiring a worker later means unpicking main-thread calls everywhere.

## PWA Shell

- **vite-plugin-pwa (Workbox):** precache the app shell + bundled template fonts so the app boots offline; runtime-cache nothing app-critical. **IndexedDB is never cached by Workbox** — Dexie is the offline data layer; Workbox only makes the code available offline.
- Request `navigator.storage.persist()` on first run to reduce eviction risk (PWA + IndexedDB both count against quota; storage-persisted sites are exempt from clearing).
- Manifest: standalone display, theme color, icons; auto-update the shell on reload (Workbox `registerType: 'autoUpdate'`).
- Boot sequence: hydrate reference stores from Dexie → hydrate document store from Dexie (or restore last-open doc) → render shell. First paint must not await PDF fonts or blob loads.

## Recommended Project Structure

```
src/
├── app/                    # route tree (TanStack Router): /, /documents/[id], /customers, /products, /settings
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, dialog, sheet, ...)
│   ├── canvas/             # canvas projection: DocumentCanvas, PageBox, SectionRenderer registry
│   └── panels/             # builder chrome: outline/layers panel, properties panel, mobile sheets
├── features/
│   ├── documents/
│   │   ├── model/          # types, factories per kind, defaults, migration, Zod schemas
│   │   ├── sections/       # per-section render packs: canvas renderer AND pdf renderer TOGETHER
│   │   ├── store/          # useDocumentStore, zundo config, actions, selection
│   │   ├── pdf/            # DocumentFactory, fonts, image resolver, worker client, download/print
│   │   ├── templates/      # TemplateRecipe registry + resolveStyle + theme merge
│   │   ├── totals/         # computeTotals, money/rounding/currency policy
│   │   └── validation/     # validateDocument + compliance checklist
│   ├── catalog/            # customers, products, company profile: stores + Dexie repos
│   ├── persistence/        # db.ts schema, repos, auto-save queue, import/export, backup/restore
│   └── settings/           # preferences store + settings UI
├── lib/                    # id (uuid), date, money formatting, breakpoint utils, debounce/throttle
└── workers/                # pdf.worker.ts (main-thread-free PDF render)
```

**Structure rationale:**
- **Feature-first (domain) over layer-first.** The persistence/UI/renderer layers all exist to serve document creation; grouping by feature keeps each feature's contracts local.
- **`sections/` holds canvas + pdf renderers together** — this is the parity-by-construction move: a new section ships with both projections in one PR, and neither can drift silently.
- **`model/` and `totals/` and `templates/` are dependency leaves** — no React, no Dexie imports. They are pure and unit-testable, which is what the parity harness and validation suite need.
- **`pdf/` and `persistence/` are the only places that touch external systems** (react-pdf, IndexedDB) — the seams that get replaced or workerized later stay confined.
## Architectural Patterns

### Pattern 1: Two Projections, One Model (the core pattern)

**What:** One immutable, serializable document model is the single source of truth. Two pure renderers project it: a DOM canvas (editable, WYSIWYG) and a react-pdf document (paged, print-ready). Style tokens, totals, and pagination policy are shared modules both projections consume. Neither renderer owns data.
**When to use:** Any time "editable on screen" and "printer-perfect output" must match — the whole reason this product exists.
**Trade-offs:** Editing UX is truly WYSIWYG, but parity is not free — it requires a pagination mirror in the canvas and a continuous screenshot-diff harness. Accept the cost or pick PDF-as-preview and lose inline editing.

```typescript
// The parity contract: identical inputs, two outputs, one verification.
const model = getCurrentDocument();                    // source of truth
const totals = computeTotals(model);                   // shared derived state
const style = resolveStyle(model.templateId, model.theme, 'lineItems.table');

// Projection A — DOM canvas (editable)
<LineItemsTable editable items={model.lineItems} style={style} />

// Projection B — PDF (print) — same data, same tokens
<PDFLineItemsTable items={model.lineItems} style={toPdfStyle(style)} totals={totals} />

// Parity harness (CI or dev): render both to images, diff.
await assertParity(renderCanvas(model), renderPdfPage(model, 1));
```

### Pattern 2: Derived State, Not Stored State

**What:** Anything computable from the model is a pure function of the model — totals, status-derived labels, due-date states. The model stores only irreducible user input and explicit overrides.
**When to use:** Aggregations that multiple views render (canvas, PDF, dashboard stats) must agree; the only way to guarantee agreement is to compute once, not store in N places.
**Trade-offs:** Recomputing on every keystroke costs CPU; memoize by input identity (`useMemo` on the model reference; immer structural sharing makes identity checks cheap). Never cache computed values back into the persisted model — that's how they drift.

### Pattern 3: Style Recipe as an Overlay on a Stable Taxonomy

**What:** A `TemplateRecipe` parameterizes rendering against a fixed section/element key taxonomy. Structure lives in the model; style lives in the recipe; the theme overrides merge over the recipe.
**When to use:** "Templates change style, never structure" (PRD §6.3) plus a future template marketplace. The taxonomy is the API templates are written against.
**Trade-offs:** Adding a genuinely new *layout* (not just a style) requires extending the taxonomy — which is exactly the PRD's intent (structure is fixed in v1; a custom template builder is future scope). Keeping this honest means the type system forbids recipes from expressing structural changes.

### Pattern 4: Snapshot Denormalization for Linked Entities

**What:** Documents embed snapshots of company/customer data at save time, alongside the source entity id. Rendering never needs a join; export is self-contained.
**When to use:** Local-first documents that must render unchanged after the catalog entity is edited or deleted, and JSON export that must round-trip standalone.
**Trade-offs:** Data duplication; a stale snapshot if the customer moves. Mitigate with an explicit "refresh from catalog" action and a dashboard hint when a linked entity changed (`updatedAt` comparison).

### Pattern 5: Temporal Undo Scoped to the Document Slice

**What:** zundo's `temporal` middleware wraps only the document store, with `partialize` excluding UI state, `limit` capping history depth, and `handleSet` throttling keystroke-level changes into single history entries.
**When to use:** Undo must exist for content, must not exist for UI chrome, and must not swallow memory on a 200-line-item document.
**Trade-offs:** History is in-memory only (documented trade — crash recovery comes from auto-save). Undoing a "refresh from catalog" needs a dedicated snapshot action, because the history diff may not capture the data-change semantics.

### Pattern 6: Debounced Auto-Save via Store Subscription

**What:** Components never write to Dexie. A `subscribeWithSelector` subscription on the document store's model slice feeds a debounced save queue that calls `db.documents.put()`.
**When to use:** Every local-first app; it is the "persistence" half of the state layer, kept unidirectional (state → save, never save → state).
**Trade-offs:** An 800ms debounce window can lose the last keystroke on hard tab-close — flush on `visibilitychange`/`pagehide`/`beforeunload`, and write-through on "save" actions.

### Pattern 7: Shared Pagination Policy

**What:** A single declarative module describes where page breaks may/must happen (section boundaries, `break-inside: avoid` for rows and headings, min-presence rules). The canvas applies it as CSS; the PDF applies it as react-pdf `break`/`wrap={false}`/`minPresenceAhead` props.
**When to use:** Any dual-projection doc where "identical preview/output" includes page breaks (PRD §6.9). Pagination is the most visible place canvas and PDF drift.
**Trade-offs:** react-pdf's Knuth–Plass text breaking differs from CSS `line-break` — text reflow between projections cannot be pixel-identical for long paragraphs. Mitigate: keep body text in short blocks, set identical font metrics (same woff2), and accept (and verify) near-identical wrapping; the harness quantifies the residual diff so it never silently grows.

### Pattern 8: Pure Renderer with Worker Offload

**What:** The PDF render path is a pure function `model → blob` with a worker boundary (`renderPdfInWorker(model)`). Main thread never does layout.
**When to use:** All long-running render work that must not jank editing; react-pdf docs mandate workers for 30+ page docs [verified].
**Trade-offs:** Worker wiring complexity early (v1 docs are small); but retrofitting a worker later means touching every call site. Build the boundary first, run main-thread first, flip the implementation later.

## Data Flow

### Request Flow (edit a line item's quantity)

```
[Canvas input: qty change]
    ↓
[store action updateItem(id, {quantity})]        # immer draft patch
    ↓
[useDocumentStore set → zundo snapshot (throttled)]   # undo/redo state
    ↓ (subscribeWithSelector on model slice, debounced 800ms)
[auto-save queue → db.documents.put(model)]      # IndexedDB
    ↓ (selector: item row + totals inputs)
[Canvas re-renders row]                          # structural sharing → cheap memo
[computeTotals(model)] → [Totals row re-renders] # derived, same function as PDF
```

### Request Flow (open document in builder)

```
[Route /documents/:id]
    ↓
[persistence repo: db.documents.get(id)]
    ↓
[useDocumentStore.load(doc)]                     # hydrate; do NOT re-snapshot catalog
    ↓
[Canvas renders model → PageBox layout → manual pagination mirror]
[PDF preview (usePDF, debounced) renders same model → side-by-side or tabbed]
```

### PDF pipeline flow

```
[Export PDF / Print]
    ↓
[resolveImage(files→base64)] + [Font.register await]
    ↓
[DocumentFactory(model) → react-pdf tree]  (worker for ≥30 pages)
    ↓
[usePDF → blob/url]
    ↓
[download(a.pdf)  |  hidden iframe + print()]
```

### Key Data Flows

1. **Edit → save:** store action → zundo snapshot → debounced subscription → `db.documents.put`. Single direction; components never touch Dexie.
2. **Reference → document:** catalog store mutation → Dexie write; document save snapshots the linked customer/profile. No reactive join at render time (snapshot pattern).
3. **Model → render:** canvas and PDF each subscribe to the same model reference; both call `computeTotals` and `resolveStyle`. Parity harness compares their page images.
4. **Import/export:** JSON parse/stringify of the model (documents) or whole workspace (all tables). Files table exported as base64 payloads inside the workspace JSON; document-only export inlines referenced file blobs so the doc round-trips alone.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user, 10s of docs | The design above, as described. Monolith-in-browser; all tables in one Dexie DB. |
| 1 user, 1k+ docs, many images | **Blob growth** hits first (logos/signatures duplicated per doc). Fix: `files` dedupe by `sha` (already schema'd), workspace backup pruning, and prefer referencing profile logos (single blob id) over per-doc copies. Second: dashboard queries — the `[kind+updatedAt]` compound index covers "recent" lists; add `limit` + pagination on list queries. |
| 100k+ users | Not applicable — no backend, no server scaling. The scaling vector that *does* apply: template marketplace (future) needs recipes externalizable as versioned JSON consumed by the same `resolveStyle` — keep `TemplateRecipe` a pure data object, not code, to keep that door open. |

### Scaling Priorities

1. **First bottleneck: PDF render latency on main thread.** Long documents (or even short ones with many images) block the editor. Fix: worker offload (pattern 8) + debounced PDF preview so typing never waits on layout.
2. **Second bottleneck: IndexedDB blob bloat.** Repeated logo/signature/image uploads inflate the DB and slow backups. Fix: `sha` dedupe in `files`, reuse profile assets by id.
3. **Third bottleneck: undo history memory on huge documents.** 200+ line items × 75 snapshots. Fix: `limit` already caps depth; consider `diff`-based history (zundo supports storing deltas) if profiling shows pressure.

## Anti-Patterns

### Anti-Pattern 1: Storing computed totals in the document model

**What people do:** persist subtotal/tax/grand total fields, recompute on change, then forget to recompute on a related change.
**Why it's wrong:** The canonical "totals out of sync" bug; canvas, PDF, and dashboard each have their own stale copy; exported JSON carries lies.
**Do this instead:** Totals are always derived from line items via one pure `computeTotals` used by every consumer.

### Anti-Pattern 2: Two hand-rolled render paths with duplicated style code

**What people do:** write Tailwind classes for the canvas and separately hand-copy colors/sizes into react-pdf styles, then wonder why preview and output differ.
**Why it's wrong:** "Identical preview/output" is structurally impossible once styles drift; every template makes it worse.
**Do this instead:** Shared `resolveStyle` tokens; per-section render packs that ship canvas+PDF together; screenshot-diff harness from Phase 3.

### Anti-Pattern 3: Undo history capturing UI state and catalog edits

**What people do:** wrap the whole app state in one undoable store.
**Why it's wrong:** Undo jumps restore panel state or clobber an unrelated customer edit; memory balloons.
**Do this instead:** `partialize` the document model only; separate reference/UI stores without temporal middleware.

### Anti-Pattern 4: Indexing blobs or booleans in Dexie

**What people do:** put logo images or `isActive: boolean` in the schema string.
**Why it's wrong:** Dexie cannot index booleans (indexable types are string/number/Date/Array only) — the index silently does nothing; indexing large blobs degrades DB performance [verified: Dexie docs].
**Do this instead:** 0/1 numeric flags; blobs in `files` stored but unindexed; index only what `where()` queries.

### Anti-Pattern 5: Deep-copying the document on every keystroke

**What people do:** `structuredClone(model)` in an update action.
**Why it's wrong:** A 200-line-item model cloned per keystroke janks the editor and defeats memoization (new identity every render).
**Do this instead:** immer for structural sharing; memoize canvas sections on stable slice references.

### Anti-Pattern 6: PDF render on the main thread for long documents

**What people do:** call `pdf(doc).toBlob()` inline on a 40-page document; the tab freezes and the browser offers to kill the script.
**Why it's wrong:** react-pdf docs explicitly call this out; editing UX dies.
**Do this instead:** worker boundary from day one (pattern 8).

### Anti-Pattern 7: Using PDFViewer as the editing canvas

**What people do:** render `<PDFViewer>` with the live model to get parity "for free".
**Why it's wrong:** You cannot inline-edit inside a PDF iframe — kills the core WYSIWYG requirement; PDF re-render per keystroke is slow.
**Do this instead:** DOM canvas for editing; PDF for preview/download/print; parity via shared tokens + harness.

### Anti-Pattern 8: Templates touching structure

**What people do:** let a template hide the line-items section or reorder blocks per template.
**Why it's wrong:** Violates PRD §6.3; document types lose their required skeleton; validation and exports become template-dependent.
**Do this instead:** recipes express style only; the taxonomy and the model are the only place structure lives.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| (none — no backend, no accounts, no cloud sync) | n/a | All integration is browser-side: IndexedDB (Dexie), PDF (react-pdf), PWA (Workbox). The only future server is a template marketplace — design `TemplateRecipe` as externalizable JSON now. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| components → stores | actions only (no direct set) | components never mutate; never write Dexie |
| stores → persistence | subscription + debounce (document); direct put (reference) | auto-save queue is the only writer to `documents` |
| model/totals/templates → renderers | pure function calls (no imports of React/Dexie from domain leaves) | keeps the parity harness and validation unit-testable in isolation |
| canvas ↔ pdf | shared `resolveStyle`, `computeTotals`, pagination policy modules | no direct component-to-component calls; both only read the model |
| persistence → files → pdf | `resolveImage(fileId) → base64 dataURI` | the only place blobs become renderable assets |
| worker ↔ main (pdf) | `renderPdfInWorker(model)` postMessage protocol | promise-based; errors surface as rejected render, never uncaught |

## Suggested Build Order (dependency-driven)

The architecture dictates the sequence: **model/persistence before rendering, rendering before editing, editing before reference-data UX, parity proven before UX polish.**

1. **Phase 1 — Foundation spike (blocking):** Validate the three open architecture questions: (a) TanStack Start client-only/SSG mode vs TanStack Router SPA for a browser-only app — Start's SSR/server-function value-add is unused here and the official docs recommend Router when you "know with certainty" you won't need server features [verified: TanStack docs]; (b) react-pdf parity feasibility: hardcode one realistic invoice, build both projections + screenshot-diff harness, confirm the pagination mirror works; (c) fonts/blobs: woff2 registration + blob→base64 in worker. **No other phase can start before (b) passes — parity is the product's core promise.**
2. **Phase 2 — Domain core + persistence:** document model types/factories/migrations, `computeTotals` + money policy, Dexie schema + repos, auto-save queue, JSON import/export utils, validation schemas. Pure logic, fully unit-testable, zero UI.
3. **Phase 3 — Render pipeline (read-only):** template recipes + `resolveStyle`, canvas renderer (read-only), PDF `DocumentFactory` + fonts + image resolver, manual pagination mirror, parity harness in dev/CI. Document *viewer* ships here.
4. **Phase 4 — Editing UX:** selection/zoom, inline editing + properties panel, dnd section/item ordering, zundo undo/redo wiring, auto-save wiring, three-pane builder + mobile sheets. Editing depends on a correct renderer (Phase 3) — you cannot WYSIWYG against a broken projection.
5. **Phase 5 — Reference data UX:** company profile, customers, products CRUD + search + favorites + quick insert; snapshot-on-save wiring into documents.
6. **Phase 6 — Validation + compliance:** end-to-end validation flows (duplicate doc number, empty items, negative values, missing company/customer/payment details), compliance checklist UI, document numbering helpers.
7. **Phase 7 — PDF delivery + print:** download, browser print via generated PDF, worker offload, watermark/status stamping. (Parcelable earlier; completes the §6.9 promise.)
8. **Phase 8 — PWA + polish:** offline boot, manifest, `storage.persist()`, backup/restore UX, empty states, dashboard stats, mobile interaction refinement.

**Phase ordering rationale:** Persistence+domain first because every phase after consumes the model and tables. Read-only rendering before editing because the editor is an editor *of* a correct renderer, and parity must be proven while rendering is cheap. Editing before reference-data because the core value ("a document in five minutes") needs the builder before accelerators like customers/products. PDF delivery late because download/print are trivial once the DocumentFactory exists, and workerization is a mechanical move behind the Phase 3 boundary. PWA last because it wraps an app that already works online.

**Research flags:** Phase 1 needs a focused feasibility spike (PDF parity), not a research pass. Phase 4 dnd + inline-editing needs standard-pattern implementation, low risk. Phase 8 backup/restore of a workspace with blobs (files table) has subtle size edge cases (base64 in JSON) — worth a mini-spike during that phase.

## Sources

- react-pdf v4 official docs — components, styling, fonts, advanced (page wrapping, `break`, `fixed`, orphan/widow, dynamic content, worker guidance): https://react-pdf.org/components , https://react-pdf.org/advanced — MEDIUM (official primary, cross-checked across two pages)
- Dexie.js official docs — schema syntax, indexing warnings (no blobs, no booleans), versioning: https://dexie.org/docs/Version/Version.stores() — MEDIUM (official primary)
- Zustand v5 README — API, middleware, slices pattern, no built-in undo: https://github.com/pmndrs/zustand — MEDIUM (official primary)
- Zundo README — temporal middleware API (partialize, limit, equality, diff, handleSet, pause/resume), production users: https://github.com/charkour/zundo — MEDIUM (maintainer primary)
- TanStack Start overview — full-stack feature set, "consider Router alone" guidance, RC status: https://tanstack.com/start/latest/docs/framework/react/overview — MEDIUM (official primary)
- PROJECT.md (Paperchaser) and Invoice_Workspace_PRD_v1.md — product constraints, pinned stack, parity requirement — HIGH (internal source of truth)
- Domain knowledge (local-first architecture, two-projection renderers, derived-state totals, snapshot denormalization) — HIGH (established patterns)

---
*Architecture research for: Paperchaser (browser-only local-first invoice/quote/receipt workspace)*
*Researched: 2026-08-07*

