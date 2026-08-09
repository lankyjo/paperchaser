---
phase: 03
slug: render-pipeline
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-09
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| fixture/demo data → DOM | Untrusted JSON shape flows through DocumentPage into the DOM | invoice content (text) |
| query string → route | `?fixture=` / `?template=` / `?size=` values cross the URL boundary | template/page-size ids, fixture keys |
| npm registry → node_modules | Newly installed font packages cross the supply-chain boundary | fontsource packages |
| logo file input → readAsDataURL | User-provided image file crosses into the document model | PNG/JPG/SVG image data |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-SC | Tampering | pnpm add @fontsource-variable/geist-mono + source-serif-4 | high | mitigate | Blocking-human checkpoint verified both packages on npmjs.com before install: publisher fontsource org, version 5.3.0, postinstall null, source repo fontsource/font-files; same batch train as the installed green @fontsource-variable/geist. | closed |
| T-03-01 | Tampering | logo img in DocumentPage header | medium | mitigate | SVG-in-img is script-inert; `logoSchema` refine enforces data: URL only (src/document/types.ts:49-54) — the upload path produces data: URLs by construction, never remote URLs. | closed |
| T-03-02 | DoS | logo file input → readAsDataURL | medium | mitigate | Type allowlist (image/png, image/jpeg, image/svg+xml) + size gate ≤ 2 MB enforced at READ time (BrandingPanel.tsx:31-32, MAX_LOGO_BYTES = 2 * 1024 * 1024) before FileReader; rejected file → inline error, no state change. | closed |
| T-03-03 | Spoofing | routes/index.tsx ?template= / ?size= params | medium | mitigate | Whitelist Set-check against TEMPLATE_REGISTRY / PAGE_SIZES keys (routes/index.tsx:6-8); unknown values degrade to resolver defaults; raw query strings never JSON-parsed, never reflected. | closed |
| T-03-04 | Tampering | DocumentPage / presets / dialog rendering model content | high | mitigate | All document content renders as React text nodes (escaped by default); raw-HTML injection grep count is 0 across src/ (dangerouslySetInnerHTML/innerHTML); branding values flow through CSS custom properties and inline styles, never innerHTML. | closed |
| T-03-05 | Info disclosure | print/PDF + dialog output | low | accept | Watermark is aria-hidden decorative overlay; first-page-only watermark is a documented ADR 0002 limitation, unchanged. | closed |
| T-03-06 | Tampering | token files (data-only modules) | low | accept | Tokens are compile-time constants in the shipped bundle — no runtime input path; a tampered token is a build-time supply-chain concern covered by the frozen lockfile + CI baseline. | closed |
| T-03-07 | Tampering | UPDATE_BASELINES golden writes | high | mitigate | UPDATE_BASELINES=1 is local-only (CI never sets it — verified, no workflow change); write path gated behind a blocking-human review checkpoint before commit; blank/wrong-size guards (width 794 + nonWhiteFraction) run on every commit. | closed |
| T-03-08 | Tampering | pageSize value → @page class / pdf format | low | mitigate | pageSize is zod-enum-constrained ('a4'\|'a5'\|'a3', types.ts:74); ?size= query param whitelisted against PAGE_SIZES; className interpolation bounded by the enum — no arbitrary class injection. | closed |

*Status: open · closed · open — below {block_on} threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-01 | T-03-05 | Watermark is aria-hidden decorative overlay; print output contains nothing beyond the document itself. First-page-only watermark is a documented ADR 0002 limitation. | user | 2026-08-09 |
| R-03-02 | T-03-06 | Token files are compile-time constants with no runtime input path; supply-chain tampering is covered by frozen lockfile + CI baseline. | user | 2026-08-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-09 | 9 | 9 | 0 | gsd-security-auditor (L1 verify) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-09
