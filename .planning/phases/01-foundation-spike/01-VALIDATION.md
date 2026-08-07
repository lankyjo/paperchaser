---
phase: 1
slug: foundation-spike
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

For Phase 1 the golden-image parity harness IS the validation architecture — it is the phase's primary deliverable and feeds VERIFICATION.md generation.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | @playwright/test 1.62.1 (Chromium) + pixelmatch 7.2.0 + pngjs 7.0.0 + pdfjs-dist 6.2.108 |
| **Config file** | `playwright.config.ts` (root) |
| **Quick run command** | `pnpm exec playwright test tests/parity.spec.ts` |
| **Full suite command** | `pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec playwright test tests/parity.spec.ts -g fixture` (fixture subset) + `pnpm typecheck`
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green; both ADRs written with the Safari acceptance evidence attached
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | (spike SC4) | T-01-03 / T-01-SC | N/A | smoke | `pnpm lint && pnpm typecheck && pnpm build && ls dist/index.html` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | (spike SC3/SC4) | T-01-01 / T-01-06 | N/A | smoke | `pnpm typecheck && pnpm build && (pnpm preview --port 4173 --strictPort &) && sleep 2 && curl -s -o /dev/null -w "%{http_code}" "http://localhost:4173/?fixture=invoice-torture" | grep -q 200 && curl -s "http://localhost:4173/?fixture=bogus" | grep -c "id=\"root\"" && kill %1; grep -rn "InnerHTML" src/ | grep -v '^#' | wc -l` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | (spike SC4) | T-01-SC | N/A | smoke | `pnpm lint && pnpm typecheck && pnpm build && ls dist/sw.js dist/manifest.webmanifest dist/favicon.svg && grep -c "registerType: 'prompt'" vite.config.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | (spike SC3) | T-01-04 / T-01-03 | N/A | integration | `pnpm typecheck && pnpm build && pnpm exec playwright test --list` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | (spike SC3) | T-01-04 | N/A | integration | `pnpm build && pnpm exec playwright test tests/parity.spec.ts && git status --short tests/fixtures/ tests/artifacts/` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | (spike SC2) | — | N/A | document | `grep -c "Decision:" docs/adr/0002-pdf-path.md && grep -c "Safari" docs/adr/0002-pdf-path.md` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | (spike SC1) | T-01-02 | N/A | document | `grep -c "Decision:" docs/adr/0001-framework.md && grep -c "TanStack Start" docs/adr/0001-framework.md` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | (spike SC4) | T-01-05 / T-01-04 | N/A | CI | `ls .github/workflows/ci.yml && grep -c "frozen-lockfile" .github/workflows/ci.yml && grep -c "playwright test\|pnpm test" .github/workflows/ci.yml && ! grep -q "UPDATE_BASELINES" .github/workflows/ci.yml && grep -c "upload-artifact" .github/workflows/ci.yml` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/parity.spec.ts` — the parity harness (SC3) — does not exist; it is the phase's core deliverable
- [ ] `playwright.config.ts` — harness config (webServer: `vite preview`, project: chromium, artifacts dir)
- [ ] `tests/helpers/raster.ts` — pdfjs-dist → PNG normalization helper
- [ ] `.github/workflows/ci.yml` — CI baseline (SC4)
- [ ] `docs/adr/0001-framework.md` + `docs/adr/0002-pdf-path.md` — ADR artifacts (SC1/SC2)
- [ ] `tests/fixtures/invoice-torture.preview.png` — committed golden baseline, generated deliberately via the `UPDATE_BASELINES` flag (01-02 task 2), never auto-written by CI
- [ ] Harness packages installed (01-01 task 1: `pnpm add -D @playwright/test pixelmatch pngjs pdfjs-dist`) and Chromium browser installed (01-02 task 1: `pnpm exec playwright install --with-deps chromium`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Safari 18.2+ paged-media fidelity + per-page watermark | SC2 (ADR 0002) | No Safari 18.2+ available in Linux CI environment | Open the generated PDF on Safari 18.2+; confirm repeating headers and per-page watermark position; attach evidence to ADR 0002 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
