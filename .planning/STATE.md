---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 3
current_phase_name: Render Pipeline
status: planning
stopped_at: Completed 02-04-PLAN.md
last_updated: "2026-08-08T10:28:35.643Z"
last_activity: 2026-08-08
last_activity_desc: Phase 02 complete, transitioned to Phase 3
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 7
  completed_plans: 7
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-07)

**Core value:** Create a professional, print-ready business document (invoice, quote, or receipt) in under five minutes with a true WYSIWYG editing experience, entirely offline in the browser.
**Current focus:** Phase 02 — domain-core-persistence

## Current Position

Phase: 3 — Render Pipeline
Plan: Not started
Status: Ready to plan
Last activity: 2026-08-08 — Phase 02 complete, transitioned to Phase 3

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 7
- Average duration: N/A
- Total execution time: N/A

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation Spike | - | TBD | - |
| 2. Domain Core & Persistence | - | TBD | - |
| 3. Render Pipeline | - | TBD | - |
| 4. Editing UX | - | TBD | - |
| 5. Reference Data UX | - | TBD | - |
| 6. Validation, Delivery & Polish | - | TBD | - |
| 01 | 3 | - | - |
| 02 | 4 | - | - |

**Recent Trend:**

- Last 5 plans: none
- Trend: Stable

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 40min | 3 tasks | 33 files |
| Phase 01 P02 | 33min | 3 tasks | 9 files |
| Phase 01 P03 | 9 min | 2 tasks | 2 files |
| Phase 02 P01 | 18min | 3 tasks | 4 files |
| Phase 02 P02 | 11 min | 3 tasks | 6 files |
| Phase 02 P03 | 8min | 3 tasks | 4 files |
| Phase 02 P04 | 13min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Framework choice (Vite SPA + TanStack Router) — RESOLVED via spike; Vite 8 SPA + TanStack Router 1.170.22 (ADR 0001), TanStack Start rejected
- [Phase 1]: PDF path (print-CSS primary) — RESOLVED via spike (ADR 0002); react-pdf 4.5.1 fallback; Safari 18.2+ acceptance PENDING (does not block Phase 2)
- [Phase 1]: Parity harness via golden-image screenshot diff — RESOLVED: Playwright + pixelmatch + pdfjs-dist; proves preview == print == PDF on torture fixture (0.0000 / 0.0306 / 0.0367 diff fractions)
- [Roadmap]: 6-phase structure (research's 8 compressed); research phases 7–8 (PDF delivery, PWA/polish) folded into Phase 6; all DASH requirements unified in Phase 6
- [Phase ?]: Shadcn 4.16.2 base-nova preset (Base UI), neutral base, CSS variables on
- [Phase ?]: workbox-window 7.4.1 required by vite-plugin-pwa prompt-mode virtual module
- [Phase ?]: baseUrl removed from tsconfigs (TS 6.0 deprecation); paths relative to tsconfig
- [Phase 01]: Print-CSS primary PDF path; react-pdf 4.5.1 fallback flip trigger = Safari 18.2+ manual acceptance failure (ADR 0002, harness-measured evidence)
- [Phase 01]: pdfjs-dist Node rasterization via @napi-rs/canvas + legacy build (plan's 'canvas' name corrected)
- [Phase 01]: @page margin 0 + page-block 15mm padding; watermark overlay global (both projections); element-box captures; page.pdf while print media emulated
- [Phase 01]: Vite 8 SPA + TanStack Router 1.170.22 is the application framework; TanStack Start rejected (RC status, Node >= 22.12 server runtime, zero in-scope server features); re-adopted only if the product gains auth/sync/shared documents (ADR 0001) — ADR 0001 evidence is research-sourced (Start RC quote, Router-alone guidance); CI baseline mirrors local gate scripts byte-for-byte with a frozen lockfile and no baseline-write step
- [Phase 02]: Scoped vitest include to src/**/*.test.ts + passWithNoTests: true in the existing vite.config.ts (no new vitest.config.ts) — vitest's default glob collides with the Phase 1 Playwright spec; zero-config assumption corrected at install time — Preserves the plan's zero-config prohibition while making the plan's own acceptance criterion (vitest run exits 0 on an empty suite) pass on this repo
- [Phase 02]: Schema-first model: Zod 4 schemas are the source of truth; z.infer derives LineItem/Company/Customer/DocumentModel, keeping Phase 1 exported names so fixtures and the renderer compile (D-15)
- [Phase 02]: Money math: integer minor units with CURRENCY_DECIMALS registry (EUR 2dp, JPY 0dp); roundMinor half-away-from-zero is the single rounding primitive, never bare Math.round (D-01..D-03, D-12, A1)
- [Phase 02]: Totals engine is the single derived source (LINE-03): per-line rounding before summation, tax on the rounded net, both discount levels, shipping/fees line-like with tax grouped by rate (D-04..D-08)
- [Phase 02]: watermark derives from status via deriveWatermark(), never stored (D-11); fixtures edited watermark->status only, parity baselines stayed green
- [Phase 02]: Typed plain-Dexie via one cast in repos.ts (rawDb as unknown as Tables)

companyRepo singleton contract: constant id 'company', strip on read
Persistence row types carry the id (CompanyRow/CustomerRow/CatalogItemRow)
Reload-survival spec re-injects UMD Dexie after page.reload(); full SCHEMA both sides — dexie 4.4.4 typings expose table props only on subclassed instances; plan pins new Dexie('paperchaser') untouched — the cast keeps db.<table> access typed and matching plan traceability
schema is id-keyed but domain Company has no id; singleton put-replaces proven by count()===1
id-keyed tables per ARCHITECTURE.md; name index for Phase 5 search
RESEARCH example omitted the re-inject (window.Dexie undefined post-reload) — Rule 1 fix

- [Phase 02]: ImportError carries keys on BOTH invalid_envelope and schema_mismatch (plan internal inconsistency resolved toward the plan branch behavior)

Zod 4.4.3 runtime literal-reject code is invalid_value not invalid_literal_value; received absent from most issues — path-based branch logic absorbs both
MAX_JSON_LENGTH 5M-char raw cap before JSON.parse (T-02-04-DOS) with ponytail upgrade-path comment
Raw Zod-4 issue-shape read via one cast (public $ZodIssue union hides expected/received/keys)

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

- [Phase 1] The foundation spike is BLOCKING — no other phase starts until framework + PDF engine ADRs are recorded and the parity harness passes on fixture documents. *(Resolved 2026-08-07 — ADRs 0001/0002 recorded, harness green, Phase 2 unblocked)*
- [Phase 1] Research flags (from SUMMARY.md): golden-image diff tooling choice (Playwright vs pixelmatch) needs a mini-spike during Phase 3 planning; blob-in-JSON backup/restore edge cases need a mini-spike during Phase 6 planning.
- [Phase 4] Mobile interaction sub-spec (PRD open question) is a required design artifact before mobile builder implementation; real-device QA mandatory.
- [All phases] PDF preview/output parity is the product's core promise — never build the editor against a projection that hasn't passed the parity harness.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-07T22:55:02.338Z
Stopped at: Completed 02-04-PLAN.md
Resume file: None
