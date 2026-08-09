---
phase: 03-render-pipeline
reviewed: 2026-08-09T11:00:00Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - src/components/BrandingPanel.tsx
  - src/components/DocumentPage.tsx
  - src/components/print/FooterDetailed.tsx
  - src/components/print/FooterMinimal.tsx
  - src/components/print/FooterStandard.tsx
  - src/components/print/HeaderBanner.tsx
  - src/components/print/HeaderCompact.tsx
  - src/components/print/HeaderStandard.tsx
  - src/components/PrintPreviewDialog.tsx
  - src/components/RenderBench.tsx
  - src/components/TemplateGallery.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/select.tsx
  - src/db/repos.ts
  - src/db/__tests__/repos.test.ts
  - src/document/fixtures.ts
  - src/document/resolveTokens.ts
  - src/document/templates/agency.ts
  - src/document/templates/blank.ts
  - src/document/templates/corporate.ts
  - src/document/templates/creative.ts
  - src/document/templates/freelancer.ts
  - src/document/templates/minimal.ts
  - src/document/templates/modern.ts
  - src/document/__tests__/tokens.test.ts
  - src/document/tokens.ts
  - src/document/types.ts
  - src/lib/useMountEffect.ts
  - src/routes/index.tsx
  - src/styles/index.css
  - src/styles/print.css
  - tests/helpers/raster.ts
  - tests/parity.spec.ts
  - package.json
  - pnpm-lock.yaml
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-08-09T11:00:00Z
**Depth:** standard
**Files Reviewed:** 32 (source) + 4 (tests/config)
**Status:** issues_found

## Summary

Reviewed the Phase 03 render-pipeline diff (base f8044b9..HEAD): token registry and resolver, 7 template token files, 6 header/footer presets, branding panel, template gallery, render bench, print-preview dialog, page-size support (A5/A3), and the extended parity harness. Unit tests (64/64) and `tsc -b` pass. Architecture is sound: pure domain layer (`src/document/`) has no React/DOM/Dexie deps, preset selection keys on resolved style tokens rather than template ids, whitelisted query params, and the house-rule mount wrapper is used in place of raw `useEffect`.

No critical (security/data-loss) issues found. Three warnings: a documented-but-broken query param path, a set of dead/misleading tokens whose UI-SPEC visuals never render, and an unhandled rejection in the demo seed path. Four info items.

## Warnings

### WR-01: `?template=` query param silently ignored on the demo (empty-store) path

**File:** `src/components/RenderBench.tsx:48-52, 170`
**Issue:** The bench header (lines 18-24) documents that "Optional template/pageSize come from the ?template= / ?size= whitelist … and flow straight into DocumentPage's resolver". On the harness path that is true (`BenchShell` receives both), but the demo path drops the template:

```tsx
if (fixtureModel !== undefined) {
  return <BenchShell model={fixtureModel} template={template} pageSize={pageSize} />
}
// Demo path (D-11): ...
return <DemoDocument pageSize={pageSize} />
```

`DemoDocument` accepts only `pageSize` — `?template=modern` on a fresh (empty-store) visit renders the seeded Minimal document with no effect, while `?size=a5` on the same path works. Documented behavior and sibling-param symmetry are both violated.
**Fix:** Pass `template` through: `function DemoDocument({ pageSize, template })` and forward to `BenchShell` (`template={template}`) so the initial bench state honors it, mirroring `pageSize`.

### WR-02: Creative band/left-offset tokens are dead — documented "token-driven 18mm left offset" never renders

**File:** `src/components/DocumentPage.tsx:47-62, 72-80`; `src/document/resolveTokens.ts:55-76`
**Issue:** `resolveTokens.ts` emits `--tpl-band-width`, `--tpl-padding-left`, `--tpl-primary`, `--tpl-accent`, `--tpl-fill`, `--tpl-radius`, `--tpl-header-style`, `--tpl-footer-style`, `--tpl-font-heading/label`, `--tpl-label-letterspacing` on `#print-root`, but a grep across `src/` shows none of these vars are ever consumed (components read `tokens.*` directly; the stylesheet never reads `--tpl-*`). Concretely:

- `bandWidth` (Modern 4mm top, Agency 8px top, Creative 8mm violet left band) renders nowhere.
- `pagePaddingLeft`/`--tpl-padding-left` (Creative 18mm) renders nowhere — `pageStyleFor` hardcodes `padding: '15mm'` and the headerPresets comment (lines 77-79) claims the "token-driven 18mm left offset [is] applied at the page level", which the code does not do.

Result: Creative's signature violet left band and 18mm offset — part of its UI-SPEC identity, and committed as token data "VERBATIM from the UI-SPEC identity table" — silently do not render, and the emitted-but-unread CSS vars mislead future maintainers into believing they take effect.
**Fix:** Either consume the vars (apply `--tpl-padding-left` in `pageStyleFor` and render the band from `--tpl-band-width` in the appropriate preset), or remove the unused emissions and update the comments. If the band visuals are deferred, mark the tokens `// ponytail:`/deferred explicitly so the divergence from UI-SPEC is visible.

### WR-03: Unhandled rejection in demo seed/load leaves the bench permanently blank

**File:** `src/components/RenderBench.tsx:173-178`
**Issue:**

```tsx
useMountEffect(() => {
  void (async () => {
    await documentsRepo.seedDemoIfEmpty()
    setModel((await documentsRepo.get(DEMO_DOCUMENT_ID)) ?? null)
  })()
})
```

If Dexie fails (private browsing, storage disabled/quota, corrupt DB), the async IIFE rejects with no `catch`: an unhandled promise rejection is logged, `model` stays `null`, and the bench renders the empty loading div forever with no recovery path.
**Fix:** Wrap in try/catch and surface an error state, e.g. `catch { setLoadError(true) }` and render an inline error message (matching the PreviewErrorBoundary pattern) instead of an infinite spinner.

## Info

### IN-01: Blank template fonts render the "Select…" placeholder instead of showing the active value

**File:** `src/components/BrandingPanel.tsx:88-93`
**Issue:** For Blank (`headingFontId: 'system'`), `headingFont`/`bodyFont` resolve to `null` because 'system' is not a brandable option — the Select shows its "Select…" placeholder, which reads as "no font chosen" even though the document renders system sans. Cosmetic, but the placeholder is semantically wrong for a value that exists.
**Fix:** Add a disabled "System (template default)" item shown when the resolved font isn't in `FONT_OPTIONS`, or show the resolved name as static text.

### IN-02: Hardcoded block count in the dialog parity test precedes the derived assertion

**File:** `tests/parity.spec.ts:442`
**Issue:** `await expect(blocks).toHaveCount(2)` hardcodes the torture fixture's current pagination before the real `=== numPages` assertion (line 452-453). If the fixture ever paginates to 3 pages, the hardcoded check fails first with a misleading message.
**Fix:** Drop the hardcoded `toHaveCount(2)` and assert only against the derived `numPages` (or derive the expected count from the measured page-block geometry).

### IN-03: Blank template's gallery card shows a blue accent swatch it doesn't have

**File:** `src/components/TemplateGallery.tsx:41-43`
**Issue:** `resolved.accent` falls back to `DEFAULT_ACCENT` (`#1d4ed8`) for Blank, whose identity is "no accent" — the Blank card displays a blue dot, implying an accent that never renders.
**Fix:** Render the accent swatch as neutral (e.g. the border token or a transparent/empty dot) when `resolved.accent` came from the default fallback rather than the template.

### IN-04: Preview measurement not re-triggered on layout changes without a key change

**File:** `src/components/PrintPreviewDialog.tsx:91-100`
**Issue:** The measure ref callback only fires on mount of the keyed container; a late webfont swap or viewport-driven reflow after the initial measure leaves `sliceCount` stale (documented in the code as the reason the harness awaits `document.fonts.ready` before opening the dialog — real users get no such guarantee). The harness path is deterministic, so this is a robustness gap, not a current failure.
**Fix:** Optionally re-key the measure container on a `document.fonts.ready` promise resolution (e.g. include a fonts-ready flag in `measureKey`) so the page count recomputes once fonts settle.

---

_Reviewed: 2026-08-09T11:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
