---
phase: 3
slug: render-pipeline
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 (unit) + @playwright/test 1.62.1 (e2e/parity) |
| **Config file** | vitest scoped in `vite.config.ts` (`include: ['src/**/*.test.ts']`); `playwright.config.ts` (tests/ dir, Chromium, DPR 1, prod build via `vite preview` on :4173) |
| **Quick run command** | `pnpm exec vitest run src/document/__tests__/tokens.test.ts` |
| **Full suite command** | `pnpm test:unit && pnpm test` (unit + parity; CI order: lint → typecheck → test:unit → build → test) |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec vitest run src/document/__tests__/tokens.test.ts` (or the touched test file) + `pnpm typecheck`
- **After every plan wave:** Run `pnpm test:unit && pnpm lint && pnpm typecheck && pnpm build && pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (assigned during planning) | 01 | 1 | TEMP-01/02/03, D-02/D-09/D-10 | — | N/A | unit | `pnpm exec vitest run src/document/__tests__/tokens.test.ts` | ❌ W0 | ⬜ pending |
| (assigned during planning) | 01 | 1 | PDF-01/02 | — | N/A | e2e | `pnpm test` (A5/A3 structural) | ❌ W0 | ⬜ pending |
| (assigned during planning) | 02 | 2 | BRND-01..06, D-04 | T-03-03 | N/A | e2e (parity) | `pnpm test` (7-template preview goldens + blend-derived band) | ❌ W0 | ⬜ pending |
| (assigned during planning) | 02 | 2 | PDF-06, BRND-07 | — | N/A | e2e (golden + diff) | `pnpm test` (7-template loop) | ❌ W0 | ⬜ pending |
| (assigned during planning) | 03 | 3 | BUIL-10, D-15 | — | N/A | e2e (parity) | `pnpm test` (dialog page-count + slice diff) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/document/__tests__/tokens.test.ts` — stubs for TEMP-01/02/03, D-02/D-09/D-10, PDF-01 defaults
- [ ] `tests/parity.spec.ts` — extend to loop 7 templates (per-template goldens + print/PDF comparisons), A5/A3 structural tests, dialog page-count test, blend-derived watermark target
- [ ] `tests/helpers/raster.ts` — add `blendColor(hex, alpha, bg)` helper
- [ ] `captureFixture` — add `await page.evaluate(() => document.fonts.ready)` (robustness, Pitfall 4)
- [ ] Fixture translation (D-05) + goldens regeneration (D-06) — content change, not a new file

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Golden baseline regeneration (`UPDATE_BASELINES=1`) | D-05/D-06 | Committed artifacts must be human-reviewed before commit | Review diffs of `tests/fixtures/*.png` after regeneration; CI never writes baselines |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
