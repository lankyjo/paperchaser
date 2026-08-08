---
phase: 03-render-pipeline
plan: 02
subsystem: rendering
tags: [templates, token-registry, fonts, fontsource, zod, whitelist]

# Dependency graph
requires:
  - phase: 03-render-pipeline
    provides: Minimal tracer slice — TemplateTokens shape, resolveTokens/toCssVars, z.enum union (7 ids), parity goldens
provides:
  - 7-entry TEMPLATE_REGISTRY keyed identically to the types.ts z.enum union (TEMP-01, edge-24)
  - six UI-SPEC-verbatim template token files (blank, modern, corporate, freelancer, agency, creative)
  - Geist Mono + Source Serif 4 bundled unconditionally via @fontsource-variable (BRND-04, Pitfall 4)
  - ?template= / ?size= route whitelist against TEMPLATE_REGISTRY / PAGE_SIZES (V5)
  - D-10/D-02/edge-10 merge semantics pinned by unit tests for plan 03's gallery to consume
affects: [03-render-pipeline plan 03 (gallery + template-switch UI), plan 05 (page-size surface), parity-spec 7-template loop, phase verification]

# Actuals (#2632) — pairs with the plan's estimate (tokens: 16000) to calibrate estimates.
actuals:
  tokens: 6947    # chars/4 over the realized diff (27790 chars, 15 files)
  tasks: 2        # Task 1 human gate + Task 2 implementation
  commits: 1      # 716f83b

# Tech tracking
tech-stack:
  added:
    - "@fontsource-variable/geist-mono@5.3.0"
    - "@fontsource-variable/source-serif-4@5.3.0"
  patterns:
    - "Style-only at scale: 7 visually distinct identities over ONE structural skeleton (TEMP-03) — adding a template = adding a token file + one registry line (D-12)"
    - "Three consumers of ONE template id list (registry keys / z.enum union / route whitelist) with set-equality unit-pinned (edge-24)"

key-files:
  created:
    - src/document/templates/blank.ts
    - src/document/templates/modern.ts
    - src/document/templates/corporate.ts
    - src/document/templates/freelancer.ts
    - src/document/templates/agency.ts
    - src/document/templates/creative.ts
  modified:
    - src/document/tokens.ts (FontId +'system', HeaderStyle +'standard-offset', TemplateTokens +labelFontId/labelLetterspacing/bandWidth/radius/pagePaddingLeft, registry 7 entries)
    - src/document/templates/minimal.ts (backfilled with new fields)
    - src/document/resolveTokens.ts (toCssVars + 5 new --tpl-* vars)
    - src/document/__tests__/tokens.test.ts (+8 tests: completeness, distinctness, D-10, D-02, edge-10)
    - src/routes/index.tsx (?template=/?size= whitelist)
    - src/components/RenderBench.tsx (template/pageSize prop pass-through)
    - src/styles/index.css (+2 unconditional font imports)
    - package.json / pnpm-lock.yaml (exact 5.3.0 pins)

key-decisions:
  - "FontId union extended with 'system' — Blank's identity is system sans ('Helvetica Neue', Arial); the branding override enum in types.ts stays 3-font (users cannot pick system as an override)"
  - "HeaderStyle extended with 'standard-offset' — Creative's 'Standard-with-offset' header; not offered as a branding override (template-default-only)"
  - "TemplateTokens extended with labelFontId / labelLetterspacing / bandWidth / radius and optional pagePaddingLeft (Creative 18mm) — exactly the fields the 7 identity tables exercise; each maps to a real --tpl-* var (no invented unused vars)"
  - "totals.rule / table.headerText picked from each template's own palette where UI-SPEC named the role but not the exact hex (e.g. Corporate grand-total rule = navy #1e3a5f; Blank = 'transparent' for no-rule)"
  - "Registry-throttled install worked around with --prefer-offline + --fetch-timeout + --network-concurrency=2 — same pinned versions, lockfile integrity chain unchanged"

requirements-completed: [TEMP-01, TEMP-02, TEMP-03, BRND-04]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "TEMPLATE_REGISTRY completeness — exactly the 7 template ids, set-equal to the types.ts z.enum union (edge-24, TEMP-01)"
    requirement: TEMP-01
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts#contains exactly the 7 template ids, matching the z.enum union in types.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pairwise template distinctness — every unordered pair differs in at least one field (TEMP-02)"
    requirement: TEMP-02
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts#every unordered pair of templates differs in at least one field"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-10 template-switch merge semantics — unset branding re-resolves from the new template (edge-08); set overrides survive the switch (edge-09)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts#D-10 — template-switch re-resolution semantics"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-02 partial branding merge on a second template — only the explicitly-set field differs from the base (edge-07)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts#freelancer with only accentColor set"
        status: pass
    human_judgment: false
  - id: D5
    description: "edge-10 — a document with an invalid template value fails documentSchema.safeParse (z.enum rejects; never silently defaulted)"
    verification:
      - kind: unit
        ref: "src/document/__tests__/tokens.test.ts#a stored document with an invalid template fails"
        status: pass
    human_judgment: false
  - id: D6
    description: "Geist Mono + Source Serif 4 pinned at 5.3.0 and bundled unconditionally via @fontsource in index.css — page.pdf() font determinism (BRND-04, Pitfall 4)"
    requirement: BRND-04
    verification:
      - kind: other
        ref: "grep 3 fontsource imports in src/styles/index.css; no fontsource import in any template file; pnpm build passes"
        status: pass
    human_judgment: false
  - id: D7
    description: "?template= / ?size= whitelisted against TEMPLATE_REGISTRY / PAGE_SIZES in routes/index.tsx — unknown values degrade to undefined → resolver defaults, never an error page (V5)"
    verification: []
    human_judgment: true
    rationale: "Runtime-only route behavior reading window.location — no unit test exercises it this wave; the parity harness does not pass template/size params yet. Verifier should confirm ?template=unknown and ?size=unknown render the minimal/a4 defaults in the browser."
  - id: D8
    description: "Parity still green on the minimal default — registry/font changes did not move the calibrated document base (TEMP-03)"
    requirement: TEMP-03
    verification:
      - kind: e2e
        ref: "pnpm test — tests/parity.spec.ts (4/4 passed, incl. golden baseline drift-free)"
        status: pass
    human_judgment: false

# Metrics
duration: 24min
completed: 2026-08-08
status: complete
---

# Phase 3 Plan 2: Fonts + 6 Templates + Registry + Whitelist Summary

**Seven data-driven template identities (blank, minimal, modern, corporate, freelancer, agency, creative) over one structural skeleton — UI-SPEC-verbatim token files registered in a 7-entry TEMPLATE_REGISTRY keyed identically to the z.enum union, both document fonts bundled unconditionally for page.pdf() determinism, and the ?template= / ?size= route params whitelisted with safe degradation.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-08-08T23:19:00Z
- **Completed:** 2026-08-08T23:43:01Z
- **Tasks:** 2 (Task 1 human-verify gate approved; Task 2 implementation)
- **Files modified:** 15

## Accomplishments

- Installed `@fontsource-variable/geist-mono@5.3.0` + `@fontsource-variable/source-serif-4@5.3.0` (exact pins) after the blocking-human legitimacy gate; all three fonts (Geist, Geist Mono, Source Serif 4) now imported unconditionally in `index.css` — page.pdf() can never swap fonts mid-capture (Pitfall 4)
- Created six `TemplateTokens` token files with values VERBATIM from the UI-SPEC identity tables (blank/modern/corporate/freelancer/agency/creative), each carrying palette hexes, fonts, borders, spacing, header/footer presets, and totals/table roles
- Extended the registry seam to 7 entries matching the z.enum union in `types.ts` exactly; the 03-01 tracer's `as Record<TemplateId, …>` cast is gone — the registry is now genuinely typed
- Extended `TemplateTokens` with exactly the fields the identity tables exercise (`labelFontId`, `labelLetterspacing`, `bandWidth`, `radius`, optional `pagePaddingLeft`), `FontId` with `'system'` (Blank), `HeaderStyle` with `'standard-offset'` (Creative); all new fields emit real `--tpl-*` CSS vars (no invented unused vars)
- Extended the security V5 route whitelist: `?template=` checked against TEMPLATE_REGISTRY keys and `?size=` against PAGE_SIZES keys; unknown values degrade to `undefined` → resolver defaults ('minimal' / 'a4'), raw query strings never reflected or JSON-parsed
- Pinned D-10/D-02/edge-10 merge semantics with 8 new unit tests (registry set-equality vs the zod enum, pairwise distinctness, template-switch re-resolution, partial merge, invalid-template rejection) — plan 03's gallery consumes exactly these semantics

## Task Commits

1. **Task 1: Verify fontsource package legitimacy before install (T-03-SC)** — human-verify gate, APPROVED (no commit)
2. **Task 2: Install + bundle fonts, six template files, 7-entry registry, route whitelist, unit tests** - `716f83b` (feat)

**Plan metadata:** (pending — this SUMMARY + STATE/ROADMAP commit)

## Files Created/Modified

- `src/document/templates/blank.ts` - Zero-decoration baseline: system sans, ink #000000, grid-only table, Compact header / Minimal footer
- `src/document/templates/modern.ts` - Clean sans, primary #1d4ed8, 4mm top band, Banner header, primary table header
- `src/document/templates/corporate.ts` - Navy #1e3a5f, Source Serif 4 headings, closed grid, Standard header / Detailed footer
- `src/document/templates/freelancer.ts` - Warm orange #ea580c, 6px rounded panels, warm gray palette
- `src/document/templates/agency.ts` - Bold mono 0.12em labels, 28px/700 title, 8px accent band, Banner / Detailed
- `src/document/templates/creative.ts` - Violet #7c3aed, display serif italic 26px, 8mm left band, 18mm left padding, standard-offset header
- `src/document/templates/minimal.ts` - Backfilled with the new token fields (no identity change)
- `src/document/tokens.ts` - FontId/HeaderStyle unions extended, TemplateTokens extended, 7-entry registry
- `src/document/resolveTokens.ts` - toCssVars emits `--tpl-font-label`, `--tpl-label-letterspacing`, `--tpl-band-width`, `--tpl-radius`, `--tpl-padding-left`
- `src/document/__tests__/tokens.test.ts` - +8 tests pinning completeness/distinctness/D-10/D-02/edge-10
- `src/routes/index.tsx` - `?template=` / `?size=` whitelist sets + safe degradation
- `src/components/RenderBench.tsx` - template/pageSize props forwarded to DocumentPage (whitelist values reach the resolver)
- `src/styles/index.css` - Two unconditional fontsource imports
- `package.json`, `pnpm-lock.yaml` - Exact 5.3.0 pins, lockfile updated

## Decisions Made

- Blank's system-sans identity forced a `'system'` FontId (unbundled stack `'Helvetica Neue', Arial, sans-serif`); the branding override enum in `types.ts` stays 3-font — system is a template default only
- Creative's "Standard-with-offset" header added as a HeaderStyle union member, not a branding override
- Rule-role colors (totals.rule, table.headerText) were drawn from each template's own palette where the UI-SPEC named the role but not the exact hex (Corporate grand-total rule = navy; Blank = `transparent` for no-rule)
- pagePaddingLeft is optional in the token shape — creative alone sets 18mm; resolver falls back to pagePadding (15mm harness contract) everywhere else

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pnpm registry downloads throttled — cache-aware install workaround**
- **Found during:** Task 2 (font install)
- **Issue:** Registry tarball + large-metadata downloads from registry.npmjs.org stalled at ~15-24 KiB/s with ETIMEDOUTs; three naive `pnpm add` runs hung (0-5 min) without completing. `pnpm view` and metadata fetches worked, confirming a large-response throttle, not a registry outage.
- **Fix:** Verified the two fontsource metadata docs + react/typescript metadata were already cached, then ran `pnpm add --prefer-offline --fetch-timeout=300000 --fetch-retries=3 --network-concurrency=2` — completed in 1m33s with both packages at the exact pinned 5.3.0.
- **Files modified:** none (command-line flags only; package.json/lockfile pins identical)
- **Verification:** `grep fontsource package.json` → both at `"5.3.0"` exact; lockfile entries present; build green
- **Committed in:** 716f83b

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The workaround changed install mechanics only — same packages, same pinned versions, lockfile integrity chain intact (pnpm still verifies dist integrity hashes). No scope creep.

## Issues Encountered

- Registry download throttling (see deviation above) — resolved with cache-aware pnpm flags; the pnpm store was confirmed free of the packages, so a genuine fetch was required
- Pre-existing lint warnings in `src/lib/useMountEffect.ts` (exhaustive-deps) and `src/components/ui/button.tsx` (fast-refresh) — out of scope for this plan (untouched files)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for plan 03 (gallery + template-switch UI):** the 7-entry registry, D-10/D-02 merge semantics (unit-pinned), and the `--tpl-*` vars for bands/radius/labels/padding are all in place; plan 03 wires HeaderPreset/FooterPreset components reading `--tpl-header-style` / `--tpl-footer-style` and consumes the pinned merge semantics with the SAME branding object on switch
- **Wired but unexercised until plan 03:** the new `--tpl-*` vars (band-width, radius, font-label, label-letterspacing, padding-left) are emitted but not yet consumed by DocumentPage's stylesheet — intentional handoff (TEMP-03: style-only, no structural change this plan)
- **Route whitelist ready:** `?template=` / `?size=` degrade safely; the parity harness will exercise them when plan 03 adds the gallery
- **Parity base unmoved:** all 4 parity tests green (golden baseline drift-free) — the calibrated document base is intact for the 7-template loop (D-06) in the parity-extension plan

---
*Phase: 03-render-pipeline*
*Completed: 2026-08-08*
