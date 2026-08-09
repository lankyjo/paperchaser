---
phase: 03-render-pipeline
plan: 03
subsystem: rendering
tags: [presets, templates, gallery, header-footer, d10, branding]

# Dependency graph
requires:
  - phase: 03-render-pipeline
    provides: 7-entry TEMPLATE_REGISTRY + resolveTokens/toCssVars emitting resolved header.style/footer.style + --tpl-* vars (plan 02)
provides:
  - six template-agnostic header/footer preset components (3×3 matrix) consuming {tokens, model} — the visible identity surface of the phase
  - DocumentPage preset selection off resolved.header.style / resolved.footer.style — zero template-id branches (TEMP-03, BRND-05)
  - TemplateGallery — fixed 7-card picker with ink/primary/accent swatches, accent-ring + check selection, instant switch (D-10)
  - bench rail + per-document template persistence via documentsRepo.put (demo path); D-10 set-branding survival proven end-to-end
affects: [03-render-pipeline plan 04 (branding panel selects the same 3×3 matrix; D-10 survival exercised via the panel), plan 05 (page sizes), parity 7-template loop]

# Actuals (#2632) — pairs with the plan's estimate (tokens: 17000, raw 29000) to calibrate estimates.
actuals:
  tokens: 7534    # chars/4 over the realized diff (30134 chars, 17 files)
  tasks: 2        # Task 1 presets + Task 2 wiring/gallery
  commits: 2      # 11c7f42, 805fe97

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bounded switch on the resolved style token (header.style/footer.style enums) instead of per-template branching — the 3×3 preset matrix is the single wiring point for BRND-05"
    - "Preset components read style values from resolved tokens (or the --tpl-* vars those tokens emit), never hardcoded hexes/fonts — the D-02 overlay contract"
    - "D-10 by construction: the bench keeps the SAME branding object on template switch; resolveTokens' partial merge re-derives unset fields from the new template"

key-files:
  created:
    - src/components/print/HeaderStandard.tsx
    - src/components/print/HeaderBanner.tsx
    - src/components/print/HeaderCompact.tsx
    - src/components/print/FooterMinimal.tsx
    - src/components/print/FooterStandard.tsx
    - src/components/print/FooterDetailed.tsx
    - src/components/TemplateGallery.tsx
  modified:
    - src/components/DocumentPage.tsx (inline header/footer → preset selection off resolved style tokens)
    - src/components/RenderBench.tsx (320px left rail + template-switch state + per-document persistence)
    - src/document/tokens.ts (palette.muted token — Rule 2)
    - src/document/templates/*.ts ×7 (muted value per template)

key-decisions:
  - "palette.muted added to the token shape (Rule 2): the pre-preset footer hardcoded #6b7280 (Minimal's 'secondary gray' per UI-SPEC) — presets are forbidden hardcoded hexes, so the footer gray became a token; the parity golden pins the value for Minimal"
  - "'standard-offset' (Creative's HeaderStyle) selects HeaderStandard — the offset is token-driven (18mm left page padding), not a distinct component; the matrix stays 3×3 as UI-SPEC defines"
  - "Template-switch persistence is demo-path-only: the ?fixture= harness path stays stateless (parity captures #print-root element box; a write would mutate the fixture)"
  - "Preset footer copy stays the pre-preset German lines — D-05 English fixture migration (plan 04) owns copy changes; the parity golden pins the minimal footer byte-identically"

patterns-established:
  - "Preset selection = Record<HeaderStyle|FooterStyle, ComponentType> keyed by the RESOLVED style enum — a missing enum member is a compile error, never a silent fallback"
  - "Every preset consumes BOTH {tokens, model} and renders React text nodes only (T-03-04)"

requirements-completed: [TEMP-03, BRND-04, BRND-05]

# Coverage metadata (#1602) — one entry per shipped deliverable.
coverage:
  - id: D1
    description: "Six template-agnostic header/footer preset components (HeaderStandard/Banner/Compact, FooterMinimal/Standard/Detailed) consuming {tokens, model} with zero hardcoded hexes or font names, zero template-id branching (BRND-05)"
    requirement: BRND-05
    verification:
      - kind: other
        ref: "grep -rn '#[0-9a-fA-F]' src/components/print/*.tsx → empty; grep -rn 'templateId' src/components/print/*.tsx → empty; pnpm typecheck && pnpm build pass"
        status: pass
    human_judgment: false
  - id: D2
    description: "DocumentPage selects header/footer presets from resolved.header.style / resolved.footer.style with no template-id branch; customer/table/totals markup byte-identical (TEMP-03, BRND-05)"
    requirement: TEMP-03
    verification:
      - kind: e2e
        ref: "pnpm test — tests/parity.spec.ts 4/4 passed incl. golden baseline drift-free on the minimal default (proves byte-identical rendered output after the preset extraction)"
        status: pass
    human_judgment: false
  - id: D3
    description: "TemplateGallery renders exactly 7 fixed cards with 3 swatch dots each (ink/primary/accent from tokens); selected card = accent ring + check; 2-column grid inside the 320px rail"
    verification:
      - kind: automated_ui
        ref: "Playwright check: 7 [role=radio] cards, 21 swatches, selected state toggles across Corporate/Agency/Creative switches"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-10 template switch — set branding survives the switch; the bench keeps the SAME branding object and re-resolves unset branding from the new template; choice persists per-document via documentsRepo.put (demo path)"
    requirement: BRND-04
    verification:
      - kind: automated_ui
        ref: "Playwright check: seeded demo with {primaryColor:#ff0000, accentColor:#00ff00}, switched to Corporate → stored doc has template=corporate AND identical branding object"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-08-09
status: complete
---

# Phase 3 Plan 3: Presets + Gallery + Wiring Summary

**Six template-agnostic header/footer preset components driven by resolved style tokens, a fixed 7-card template gallery with instant D-10 switching, and a 320px bench rail with per-document template persistence — the first visible, switchable identity surface of the style-only template promise.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-09T01:10:00Z
- **Completed:** 2026-08-09T01:35:46Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Created the 3×3 preset matrix in `src/components/print/` — HeaderStandard (split), HeaderBanner (primary band), HeaderCompact (single-line + hairline), FooterMinimal, FooterStandard (rule + blurb), FooterDetailed (double rule + small print). Every preset consumes `{tokens, model}`, reads style values from resolved tokens only (never hardcoded hexes/fonts), and renders content as React text nodes (T-03-04).
- Rewired DocumentPage: inline header/footer replaced by `headerPresets[resolved.header.style]` / `footerPresets[resolved.footer.style]` — a bounded switch on the RESOLVED style enum (BRND-05), never on the document's template id. Customer section, table, and totals markup untouched (TEMP-03).
- Built TemplateGallery — fixed 7 cards (Blank/Minimal/Modern/Corporate/Freelancer/Agency/Creative), each with 3 swatch dots (ink/primary/accent from its resolved tokens), accent ring + check on the selected card, 2-column grid in the 320px rail, no empty/error/partial states (UI-SPEC dismissed rows).
- Wired the gallery into the bench: 320px left rail; the template-switch handler keeps the SAME branding object (D-10 — unset branding re-derives from the new template, set overrides survive by the partial-merge construction) and persists the choice per-document via `documentsRepo.put` on the demo path.
- Proved D-10 end-to-end with a Playwright check: seeded the demo with explicitly-set branding, switched templates in the gallery, and confirmed the stored document keeps `template=corporate` AND the identical branding object.
- Parity stayed green throughout: all 4 harness tests pass including the golden baseline drift-free on the minimal default — the preset extraction changed zero rendered pixels.

## Task Commits

1. **Task 1: Create the six template-agnostic header/footer preset components (BRND-05)** - `11c7f42` (feat)
2. **Task 2: Wire presets into DocumentPage + TemplateGallery + bench rail with D-10 template-switch re-resolution** - `805fe97` (feat)

**Plan metadata:** (pending — this SUMMARY + STATE/ROADMAP commit)

## Files Created/Modified

- `src/components/print/HeaderStandard.tsx` - Split layout (company left, title/meta right); Minimal/Corporate/Freelancer + Creative's standard-offset
- `src/components/print/HeaderBanner.tsx` - Full-width primary-color band, white content, 90%-opacity meta; Modern/Agency
- `src/components/print/HeaderCompact.tsx` - Single line (logo+name left, title+number+date right), hairline rule; Blank
- `src/components/print/FooterMinimal.tsx` - Muted gray blurb (exact pre-preset copy — parity-pinned); Blank/Minimal/Modern
- `src/components/print/FooterStandard.tsx` - Border rule + 2-line blurb; Freelancer/Creative
- `src/components/print/FooterDetailed.tsx` - Double rule + small-print grid incl. company contact; Corporate/Agency
- `src/components/TemplateGallery.tsx` - Fixed 7-card picker, swatches, selection ring + check
- `src/components/DocumentPage.tsx` - Header/footer → preset selection off resolved style tokens; middle markup byte-identical
- `src/components/RenderBench.tsx` - 320px rail, template state, D-10 persistence callback
- `src/document/tokens.ts` - `palette.muted` added (Rule 2)
- `src/document/templates/*.ts` ×7 - `muted` value per template (UI-SPEC secondary grays)

## Decisions Made

- **`palette.muted` token (Rule 2):** the pre-preset footer hardcoded `#6b7280` (Minimal's "secondary gray" per UI-SPEC identity table). Presets are forbidden hardcoded hexes by the plan's acceptance greps, so the footer gray became a token — populated per-template from the UI-SPEC grays (Minimal `#6b7280` parity-critical, Corporate `#4b5563`, Freelancer `#78716c`, Creative `#a1a1aa`). The parity golden pins the Minimal value.
- **`standard-offset` maps to HeaderStandard:** Creative's HeaderStyle is "Standard-with-offset" — the offset is token-driven (18mm left page padding via `--tpl-padding-left`), not a distinct layout. The matrix stays the UI-SPEC 3×3.
- **Persistence is demo-path-only:** the `?fixture=` harness path stays stateless — parity captures the `#print-root` element box and a write would mutate the fixture under test.
- **Preset footer copy stays German:** D-05 (English fixture migration, plan 04) owns copy changes; the minimal golden pins the current text byte-identically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `palette.muted` token for the footer gray**
- **Found during:** Task 1 (FooterMinimal creation)
- **Issue:** The plan's acceptance criteria ban hardcoded hexes in presets (grep `#[0-9a-fA-F]` must return nothing), but the pre-preset footer color `#6b7280` (Minimal's "secondary gray", UI-SPEC) exists nowhere in the token shape. FooterMinimal/Standard/Detailed all render muted text — the value must be token-driven to satisfy the grep while keeping the minimal golden byte-identical.
- **Fix:** Added `palette.muted` to `TemplateTokens` and a `muted` value to all 7 template files (UI-SPEC secondary grays); the footer presets read `tokens.palette.muted`. The resolver spreads `base.palette` so the token flows through untouched.
- **Files modified:** src/document/tokens.ts, src/document/templates/*.ts ×7, FooterMinimal/Standard/Detailed.tsx
- **Verification:** `pnpm test` — golden baseline drift-free (Minimal renders `#6b7280` identically); `pnpm typecheck && pnpm build` pass
- **Committed in:** 11c7f42 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The token addition is a data-only shape extension consistent with D-12 (templates as token data); it is required to satisfy the plan's own no-hardcoded-hex acceptance criteria. No scope creep beyond the footer gray.

## Issues Encountered

- Two Playwright check scripts (`zz-*.spec.ts`) were written and run ad hoc to verify gallery rendering and D-10 survival, then deleted — no committed test files were added because the plan's `files_modified` list does not include spec files (the parity harness plus the plan-02 unit tests remain the committed coverage).
- Ad-hoc checks needed raw IndexedDB access: the built bundle does not expose `dexie` as an importable module specifier inside `page.evaluate`, so the D-10 check wrote/read the `paperchaser` db via raw IDB APIs directly.
- Pre-existing lint warnings in `src/lib/useMountEffect.ts` (exhaustive-deps) and `src/components/ui/button.tsx` (fast-refresh) — out of scope (untouched files).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for plan 04 (branding panel):** the 3×3 preset matrix is wired and gallery-verified; the BrandingPanel's header/footer selects map to the same `resolved.header.style` / `resolved.footer.style` tokens (BRND-05 key_link); D-10 set-branding survival is proven at the UI level so the panel can rely on it.
- **Parity base unmoved:** golden baseline drift-free — the 7-template parity loop (D-06) can extend without re-baselining the minimal template.
- **Known handoff:** `--tpl-padding-left` (Creative's 18mm offset) is emitted but the page-level padding application is plan 05 territory (page-size surface touches pageStyle).
- **Pending human-check (end-of-phase):** click all 7 gallery cards — each re-renders instantly with a distinct identity; document content identical across switches; page structure never changes.

---
*Phase: 03-render-pipeline*
*Completed: 2026-08-09*

## Self-Check: PASSED

- All 7 key files confirmed present on disk (6 preset components + TemplateGallery + SUMMARY)
- Commits confirmed in git log: `11c7f42` (Task 1), `805fe97` (Task 2)
- Wave-3 gate green: vitest 13/13, `pnpm lint` exit 0 (2 pre-existing out-of-scope warnings), `pnpm typecheck`, `pnpm build`, `pnpm test` 4/4 parity incl. golden baseline drift-free
- Ad-hoc Playwright checks green: gallery 7 cards/21 swatches/selection toggles; D-10 set-branding survives template switch and persists per-document
