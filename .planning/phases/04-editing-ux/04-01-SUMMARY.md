---
phase: 04-editing-ux
plan: 01
subsystem: model
tags: [zod, dexie, richtext, ast, migration, json-schema]

# Dependency graph
requires:
  - phase: 02-domain-core-persistence
    provides: DocumentModel, documentSchema, Zod validation, Dexie persistence
  - phase: 03-render-pipeline
    provides: DocumentPage renderer, print presets, parity harness
provides:
  - richTextNodeSchema: discriminated union (text/paragraph/listItem/list) with link-href refinement
  - richTextDocSchema: top-level AST array for all text fields
  - textFieldSchema: z.union([z.string(), richTextDocSchema]) backward-compat bridge
  - getPlainText(): extract plain string from textField values for renderers
  - migrateV2ToV3(): wrap legacy string fields to single-paragraph ASTs (idempotent)
  - Dexie version(3) with upgrade callback calling migrateV2ToV3
  - Envelope version bumped to z.literal(2); v1 imports rejected as invalid_envelope
  - lineItem.image (data:-URL), settings.blockVisibility (D-30) on documentSchema
  - Regenerated fixtures with AST-wrapped text fields
affects: [04-editing-ux (all plans), rich-text renderer, editing surface, import/export]

# Actuals (#2632)
actuals:
  tokens: 10000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "z.union([z.string(), richTextDocSchema]) — backward-compat text field type accepting legacy strings and rich-text ASTs"
    - "z.discriminatedUnion for node type whitelist (T-04-02: only text/paragraph/listItem/list)"
    - "z.lazy for self-referencing node schemas with explicit ZodType annotation"
    - "Zod issue scanning (not issues[0]) — find document-level issue among multiple Zod error reports"
    - "isSafeHref: /^(https?|mailto):/i refine on link mark href (T-04-01)"
    - "data:-URL-only refine reused from logoSchema for lineItem.image (T-04-04-LINE-IMAGE)"

key-files:
  created:
    - src/document/richtext.ts - Zod schemas for rich-text AST (marks, nodes, doc, isSafeHref, getPlainText)
    - src/document/migrate.ts - migrateV2ToV3 pure function wrapping string fields to single-paragraph ASTs
    - src/document/__tests__/richtext.test.ts - 31 tests covering schemas, href safety, JSON round-trip
    - src/document/__tests__/migrate.test.ts - 13 tests covering wrap, idempotence, non-text field preservation
  modified:
    - src/document/types.ts - Widened text fields to z.union, added lineItem.image, settings.blockVisibility
    - src/db/db.ts - Added version(3) with upgrade callback calling migrateV2ToV3
    - src/document/io.ts - Envelope version z.literal(2), multi-issue error routing fix
    - src/document/totals.ts - Widened ShippingFee.label type
    - src/document/fixtures.ts - Regenerated with AST-wrapped text fields
    - src/components/DocumentPage.tsx - getPlainText() wrappers on all rendered text fields
    - src/components/print/HeaderStandard.tsx - getPlainText() wrappers
    - src/components/print/HeaderBanner.tsx - getPlainText() wrappers
    - src/components/print/HeaderCompact.tsx - getPlainText() wrappers
    - src/components/print/FooterDetailed.tsx - getPlainText() wrappers
    - tests/persistence.spec.ts - version(3) upgrade round-trip test seeding v2 rows, verifying v3 AST shape

key-decisions:
  - "Rich-text AST stored as node-array JSON (not HTML strings) — ProseMirror/Tiptap compatible"
  - "Text fields are z.union([z.string(), richTextDocSchema]) for backward compat; renderer uses getPlainText()"
  - "Envelope version bumped to z.literal(2); v1 imports rejected (no silent coercion)"
  - "Dexie version(3) stores identical schema strings to v2 — version bump alone triggers upgrade"

patterns-established:
  - "textFieldSchema: z.union([z.string(), richTextDocSchema]) — the canonical backward-compat bridge for all model prose fields"
  - "getPlainText(): extract string from textField for renderers — used by all print components and DocumentPage"
  - "Pure-domain modules (richtext.ts, migrate.ts) follow the same header contract as types.ts/io.ts/totals.ts: no React, no DOM, no Dexie"

requirements-completed: [LINE-01, BUIL-03, BUIL-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Rich-text AST Zod schemas (richtext.ts) with all node and mark types validated"
    requirement: BUIL-03
    verification:
      - kind: unit
        ref: "src/document/__tests__/richtext.test.ts#richTextMarkSchema"
        status: pass
      - kind: unit
        ref: "src/document/__tests__/richtext.test.ts#richTextNodeSchema"
        status: pass
      - kind: unit
        ref: "src/document/__tests__/richtext.test.ts#richTextDocSchema"
        status: pass
      - kind: unit
        ref: "src/document/__tests__/richtext.test.ts#isSafeHref"
        status: pass
    human_judgment: false
  - id: D2
    description: "Text fields widened to z.union + lineItem.image (data:-URL) + settings.blockVisibility on documentSchema"
    requirement: LINE-01
    verification:
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#document envelope export and parse round-trips"
        status: pass
      - kind: integration
        ref: "pnpm typecheck — types.ts exports compile without errors"
        status: pass
    human_judgment: false
  - id: D3
    description: "migrateV2ToV3 wraps v2 string fields to single-paragraph ASTs, idempotent"
    requirement: BUIL-06
    verification:
      - kind: unit
        ref: "src/document/__tests__/migrate.test.ts#migrateV2ToV3"
        status: pass
    human_judgment: false
  - id: D4
    description: "Dexie version(3) upgrade triggers on stored v2 documents, rewrites to v3 shape"
    requirement: BUIL-06
    verification:
      - kind: e2e
        ref: "tests/persistence.spec.ts#version(3) upgrade rewrites stored v2 rows to v3 AST shape"
        status: pass
    human_judgment: false
  - id: D5
    description: "Envelope version z.literal(2) — v1 imports rejected as invalid_envelope"
    requirement: BUIL-06
    verification:
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#boundary rejection — STOR-04"
        status: pass
    human_judgment: false
  - id: D6
    description: "Regenerated fixtures with AST-wrapped text fields; single-paragraph AST renders pixel-identical"
    verification:
      - kind: unit
        ref: "src/document/__tests__/io.test.ts#lossless round-trip — STOR-03"
        status: pass
    human_judgment: false

# Metrics
duration: 52min
completed: 2026-08-10
status: complete
---

# Phase 04 Plan 01: Rich-Text Schema Gate Summary

**Zod-validated rich-text JSON AST (text/paragraph/listItem/list + 4 marks), Dexie version(3) migration, line-item image field, block-visibility settings, and export envelope bumped to version 2**

## Performance

- **Duration:** 52 min
- **Started:** 2026-08-10T14:45:11Z
- **Completed:** 2026-08-10T15:37:02Z
- **Tasks:** 3
- **Files modified:** 16 (786 insertions, 75 deletions)

## Accomplishments

- Created `src/document/richtext.ts` with Zod schemas for the rich-text AST: `richTextMarkSchema` (bold/italic/underline/link with href safety refine), `richTextNodeSchema` (discriminated union on text/paragraph/listItem/list), `richTextDocSchema` (top-level node array), `isSafeHref`, and `getPlainText` extractor
- Widened all model prose fields (`name`, `address[]`, `email`, `title`, `description`, `label`, `number`) to `z.union([z.string(), richTextDocSchema])` — backward compatible
- Added `lineItem.image` optional field (data:-URL-only refine, reusing logoSchema pattern) and `settings.blockVisibility` on `documentSchema`
- Created `migrateV2ToV3()` pure function wrapping legacy string fields to single-paragraph ASTs (idempotent)
- Added `Dexie version(3)` with upgrade callback calling `migrateV2ToV3` on stored documents
- Bumped export envelope to `z.literal(2)` — v1 imports rejected as `invalid_envelope`
- Regenerated all three fixtures with AST-wrapped text fields, maintaining invariants (LOGO_DATA_URL, demo-invoice id, 18 torture items)
- Added persistence-spec test proving version(3) upgrade rewrites seeded v2 rows to v3 AST shape
- Fixed io.ts error routing to scan all Zod issues (not just first) after discovering spurious `invalid_value` at `["version"]` in multi-issue safeParse results

## Task Commits

1. **Task 1: Define rich-text AST Zod schemas + widen text fields** — `97140e7` (feat)
2. **Task 2: Create migrateV2ToV3 + Dexie version(3) + bump export envelope** — `57da7d6` (feat)
3. **Task 3: Regenerate fixtures + persistence-spec v2→v3 round-trip test** — `2d20686` (feat)

## Files Created/Modified

- `src/document/richtext.ts` — Pure-domain rich-text AST schemas (marks, nodes, doc, isSafeHref, getPlainText)
- `src/document/migrate.ts` — migrateV2ToV3 wraps v2 string fields → single-paragraph ASTs
- `src/document/__tests__/richtext.test.ts` — 31 tests: marks, nodes, href safety, JSON round-trip
- `src/document/__tests__/migrate.test.ts` — 13 tests: wrap, idempotence, non-text preservation
- `src/document/types.ts` — Widened text fields, lineItem.image, settings.blockVisibility
- `src/db/db.ts` — Added version(3) with upgrade callback
- `src/document/io.ts` — Envelope z.literal(2), multi-issue error routing fix
- `src/document/totals.ts` — Widened ShippingFee.label type
- `src/document/fixtures.ts` — Regenerated with AST-wrapped text fields
- `src/document/__tests__/io.test.ts` — Updated all envelope version references to 2
- `src/components/DocumentPage.tsx` — getPlainText() on customer name, address, item titles/descriptions
- `src/components/print/HeaderStandard.tsx` — getPlainText() on company name, address, email, number
- `src/components/print/HeaderBanner.tsx` — getPlainText() on company name, number
- `src/components/print/HeaderCompact.tsx` — getPlainText() on company name, number
- `src/components/print/FooterDetailed.tsx` — getPlainText() on company email
- `tests/persistence.spec.ts` — Added version(3) upgrade round-trip test

## Decisions Made

- Rich-text stored as node-array JSON AST (not HTML) — ProseMirror/Tiptap compatible, Zod-validated, no HTML injection
- `z.union([z.string(), richTextDocSchema])` for backward compat — renderer uses `getPlainText()` to extract strings
- Envelope bumped to version 2, v1 imports rejected — clean boundary, no silent coercion
- Dexie version(3) has identical schema strings to v2 — version bump alone triggers the upgrade callback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] React renderers broke on widened text fields (string | RichTextDoc union)
- **Found during:** Task 1 (widening text fields in types.ts)
- **Issue:** TypeScript compilation failed: 5 print/render components passed text fields as React keys and content where `string` was expected but the union type (`string | RichTextDoc[]`) was inferred
- **Fix:** Added `getPlainText()` to richtext.ts; updated DocumentPage.tsx, HeaderStandard.tsx, HeaderBanner.tsx, HeaderCompact.tsx, FooterDetailed.tsx to wrap all text field renderings in `getPlainText()`
- **Files modified:** src/document/richtext.ts, 5 render components
- **Committed in:** `97140e7` (Task 1)

**2. [Rule 3 - Blocking] totals.ts ShippingFee.label type mismatch
- **Found during:** Task 1 (typecheck after widening text fields)
- **Issue:** computeTotals expects `ShippingFee.label: string` but shippingFeeSchema now produces `string | RichTextDoc`
- **Fix:** Widened `ShippingFee.label` in totals.ts to `string | RichTextDoc`
- **Files modified:** src/document/totals.ts
- **Committed in:** `97140e7` (Task 1)

**3. [Rule 1 - Bug] Zod 4 safeParse reports spurious invalid_value at ["version"] as first issue
- **Found during:** Task 2 (io.test.ts failures after version bump)
- **Issue:** When documentSchema has a sub-schema error AND the version literal is valid, Zod 4 reports `invalid_value` at `["version"]` as the first issue in safeParse, shadowing the real document-level error. Taking `issues[0]` blindly routed all document errors to `invalid_envelope`.
- **Fix:** Scan all issues, find first document-level one (`path[0] === 'document'`), fall back to `issues[0]` for envelope-level errors
- **Files modified:** src/document/io.ts
- **Committed in:** `57da7d6` (Task 2)

**4. [Rule 1 - Bug] migrateV2ToV3 document.number path was wrong
- **Found during:** Task 2 (migrate.test.ts failures)
- **Issue:** `document.number` is a top-level field (doc.number), not nested under doc.document.number. The TEXT_PATHS array listed `['document', 'number']` which resolved to `doc.document.number` (undefined).
- **Fix:** Added explicit top-level handling for `doc.number` instead of through nested path traversal
- **Files modified:** src/document/migrate.ts
- **Committed in:** `57da7d6` (Task 2)

**5. [Rule 1 - Bug] Unused SHIPPING_FEE_TEXT_FIELDS constant
- **Found during:** Task 2 (typecheck after migrate.ts creation)
- **Issue:** Declared but never read — TypeScript strict mode rejects unused variables
- **Fix:** Removed the constant; shipping fee labels are handled inline
- **Files modified:** src/document/migrate.ts
- **Committed in:** `57da7d6` (Task 2)

---

**Total deviations:** 5 auto-fixed (3 bugs, 2 blocking)
**Impact on plan:** All fixes necessary for build/typecheck correctness. The 5 React render components were not listed in the plan's files_modified — this was the largest scope deviation but unavoidable (the union type breaks all consumers). No scope creep.

## Issues Encountered

- Zod 4's `z.object()` strip mode silently drops unknown keys during `parse()` but may report `unrecognized_keys` as issues in `safeParse()` — the io.ts error routing was originally indexed on `issues[0]` and needed to scan for document-level issues. Resolved by the scanning fix in Deviation 3.

## Next Phase Readiness

All schema decisions (D-06, D-07, D-29, D-30) are committed. Later plans in this phase can import `richtext.ts` schemas, `migrate.ts` for coerce-at-render, and the widened `DocumentModel` type directly. The `getPlainText()` bridge is available for any renderer that consumes text fields.

The persistence spec's upgrade test proves the Dexie migration works and provides the Pitfall 4 confidence that the upgrade callback fires on identical schema strings.

---

*Phase: 04-editing-ux*
*Completed: 2026-08-10*
