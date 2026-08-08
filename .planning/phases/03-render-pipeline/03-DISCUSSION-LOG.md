# Phase 3: Render Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-08
**Phase:** 3-Render Pipeline
**Areas discussed:** Branding persistence model, Fixture language migration, Default template & back-compat, Template engine architecture

---

## Branding persistence model

| Option | Description | Selected |
|--------|-------------|----------|
| Per-document only | Each document stores its own branding; new docs start from template defaults | ✓ |
| Company-profile shared + per-doc override | Branding at company level, documents inherit, override per-doc | |
| Company defaults, doc snapshots | Company holds defaults, each doc snapshots a copy at creation | |

**User's choice:** Per-document only
**Notes:** Matches the UI-SPEC model fields. Confirmed branding is not shared or inherited.

| Option | Description | Selected |
|--------|-------------|----------|
| Template defaults, optional overrides | Unset branding falls back to active template defaults | ✓ |
| Always concrete (snapshot at creation) | Branding fields always present, copied from template at creation | |

**User's choice:** Template defaults, optional overrides
**Notes:** "Branding overrides sit ON TOP of template defaults" (UI-SPEC).

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse company.logo, no separate field | Renderer reads company.logo for header logo; one source of truth | ✓ |
| Separate branding.logo override | Branding carries its own optional logo overriding company.logo | |

**User's choice:** Reuse company.logo, no separate field
**Notes:** Matches UI-SPEC (T-02-02 data: URL constraint preserved).

| Option | Description | Selected |
|--------|-------------|----------|
| Accent-colored watermark | Watermark uses brand accent (or template primary when unset) | ✓ |
| Fixed neutral watermark color | Watermark stays a fixed color independent of branding | |

**User's choice:** Accent-colored watermark
**Notes:** Existing `.watermark` geometry (64px, rotate, opacity 0.15) stays fixed.

---

## Fixture language migration

| Option | Description | Selected |
|--------|-------------|----------|
| Translate + regenerate baselines | Translate fixtures to English, regenerate golden via UPDATE_BASELINES=1 | ✓ |
| Add English fixtures alongside | Keep German, add English parity inputs | |
| Translate simple only, keep torture German | Mixed-language fixtures | |

**User's choice:** Translate + regenerate baselines
**Notes:** Decision 4 flag from UI-SPEC resolved. Translation preserves pagination-stress purpose.

| Option | Description | Selected |
|--------|-------------|----------|
| Torture × all 7 templates | Parity loops torture fixture × 7 templates (7 goldens + PDF) | ✓ |
| One template golden only | Golden for a default template only | |

**User's choice:** Torture × all 7 templates
**Notes:** Proves every template is parity-clean per PDF-06.

| Option | Description | Selected |
|--------|-------------|----------|
| A4 goldens; A5/A3 via structure tests | A4 golden baselines; A5/A3 verified structurally | ✓ |
| Goldens for all three sizes | 21 golden images (A4+A5+A3 × 7 templates) | |

**User's choice:** A4 goldens; A5/A3 via structure tests
**Notes:** Harness geometry contract — baselines stay A4.

| Option | Description | Selected |
|--------|-------------|----------|
| In-place translation, same ids | Same fixture ids, English content, one regeneration pass | ✓ |
| New ids, delete German | New English ids, cascade rename | |

**User's choice:** In-place translation, same ids
**Notes:** English is now the phase language everywhere.

---

## Default template & back-compat

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | The neutral, professional default canvas for branding | ✓ |
| Blank | Raw, undecorated baseline | |
| Modern | Accent band + flat table, more visual identity by default | |

**User's choice:** Minimal
**Notes:** Used for new documents and the empty-store seeded demo.

| Option | Description | Selected |
|--------|-------------|----------|
| Optional fields, render-time default | template/branding/pageSize optional; missing template → Minimal at render | ✓ |
| Required fields + Dexie backfill migration | Required fields + version(3) backfill on every stored doc | |

**User's choice:** Optional fields, render-time default
**Notes:** No migration; existing docs render immediately (TEMP-03).

| Option | Description | Selected |
|--------|-------------|----------|
| Unset follows new template | Unset branding re-resolves from new template defaults on switch | ✓ |
| Snapshot resolved values on switch | Implicitly-resolved branding frozen at old template values | |

**User's choice:** Unset follows new template
**Notes:** Explicit overrides survive the switch; unset fields follow.

| Option | Description | Selected |
|--------|-------------|----------|
| Seed demo when store empty | Create English Minimal demo doc on first empty-store bench load | ✓ |
| No seed, empty state | Empty store shows blank/empty state | |

**User's choice:** Seed demo when store empty
**Notes:** Matches UI-SPEC; `?fixture=` route stays for parity tests.

---

## Template engine architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Data-driven token registry | Each template = plain TS token object; DocumentPage consumes token set | ✓ |
| Per-template CSS classes | Each template gets its own CSS class | |

**User's choice:** Data-driven token registry
**Notes:** Templates are data; adding one is adding a file. Mirrors UI-SPEC identity tables.

| Option | Description | Selected |
|--------|-------------|----------|
| CSS variables per token | Tokens + branding resolve to CSS custom properties on #print-root | ✓ |
| Resolved inline style object | Tokens resolved into a React style object | |

**User's choice:** CSS variables per token
**Notes:** DOM/component stays template-agnostic; print projection inherits automatically.

| Option | Description | Selected |
|--------|-------------|----------|
| Pure resolver in document layer | resolveTemplateTokens(model) in src/document/, Node-testable | ✓ |
| Resolve inside DocumentPage | Resolution lives in a component/hook | |

**User's choice:** Pure resolver in document layer
**Notes:** Preserves the "domain layer is pure" pattern (like totals.ts).

| Option | Description | Selected |
|--------|-------------|----------|
| Measure-and-slice into page blocks | Hidden measure container, slice by page-height offsets, render each slice | ✓ |
| Continuous preview + break marks | Single continuous preview with page-boundary overlay | |

**User's choice:** Measure-and-slice into page blocks
**Notes:** Same DOM, one truth, "Page 1 of N" counter (matches UI-SPEC print-preview surface).

---

## the agent's Discretion

No "you decide" answers were given this session — all areas were locked by explicit choice.

## Deferred Ideas

- **PDF download (PDF-07) and browser print surface (PDF-08)** — Phase 6.
- **Company-profile-level branding defaults** — rejected for this phase; per-document branding only (D-01); shared profile-level branding is a Phase 5 concern if needed.
