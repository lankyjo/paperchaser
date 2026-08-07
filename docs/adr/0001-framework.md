# ADR 0001: Application Framework — Vite SPA + TanStack Router vs TanStack Start

**Status:** Accepted
**Date:** 2026-08-07
**Context refs:** ROADMAP Phase 1 SC1 · RESEARCH.md (Open Question 1, Pitfall 12) · STACK.md (§Decision 1) · PROJECT.md Key Decisions ("Validate stack in Phase 1 spike" — the PRD's "keep PRD stack" decision is Pending, to be validated by this spike)

## Context

Paperchaser is a **no-backend, no-accounts, local-first SPA**: the document
workspace runs entirely in the browser, data lives in IndexedDB, and the
product's out-of-scope table rejects auth, sync, and email (REQUIREMENTS.md).
Deployment must be static files only — there is no server tier in the product.

The PRD pinned **TanStack Start** as the framework. PROJECT.md records the
"keep PRD stack" decision as **Pending**, to be validated by this spike. The
two candidates:

1. **Vite 8 SPA + TanStack Router** — a static build with a client-side
   type-safe router, the TanStack family minus the server half.
2. **TanStack Start** — the full-stack framework the PRD pinned, built 100% on
   TanStack Router but adding SSR, streaming, server routes, server functions,
   middleware, and full-stack builds.

TanStack Start is **Release Candidate** status — its own overview states it is
"considered feature-complete and its API is considered stable. This does not
mean it is bug-free or without issues" — and it requires a **Node >= 22.12
server runtime** for those features, none of which this product uses.

## Decision

**Decision: Vite 8 SPA + TanStack Router 1.170.22 (code-based routes) is the application framework. TanStack Start is rejected; it is re-adopted only if the product later gains server features (auth, sync, shared documents).**

This overrides the PRD's TanStack Start pin. The PRD itself mandates the
validation: "Validate stack in Phase 1 spike" (PROJECT.md Key Decisions), and
the spike's research resolves Open Question 1 in this direction with primary
sources.

## Evidence

### TanStack Start's own guidance recommends Router alone for this app

TanStack Start's overview, quoted in RESEARCH.md Open Question 1:

> "if you know with certainty that you will not need any of the above features
> [SSR, server routes, server functions, streaming, middleware, full-stack
> builds], then you may want to consider using TanStack Router alone."

Paperchaser needs none of those features — no backend, no accounts, no SEO
requirement, offline-first. This is precisely the "Router alone" case.

### TanStack Start is Release Candidate, not stable

Per its own overview: "considered feature-complete and its API is considered
stable. This does not mean it is bug-free or without issues." Betting a
greenfield product's core files on an RC framework's churn is a documented
cost pitfall (research Pitfall 12).

### No server features exist in scope

| Start feature | Paperchaser need |
|---|---|
| SSR / hydration | None — client-only rendering |
| Streaming | None |
| Server routes / server functions | None — no backend, no auth, no sync |
| Middleware | None |
| Full-stack build | None — static deploy only |

Every server feature would force a server build pipeline and deployment to a
Node runtime for a product whose core constraint is "no backend, privacy-first,
static deploy" (research Pitfall 12). A pure SPA additionally eliminates the
SSR client-API trap class (`window`/IndexedDB guards during render, hydration
mismatch errors) for the local-first stack (Dexie, the PWA registration hook).

### Router version verified

`@tanstack/react-router` 1.170.22 verified on npm (2026-08-07) with a React 19
peer dependency — matching the installed React 19.2.8. The TanStack family
investment (Router/Form/Query) is retained; only the server half is dropped.

### Static deploy matches the no-backend constraint

A Vite SPA build emits `dist/` static files only — no Node/edge runtime, no
SPA-mode/prerendering config for static hosts. The spike proves the static
build boots and deploys (ROADMAP SC4).

### Alternatives considered

| Alternative | Verdict | Reason |
|---|---|---|
| **TanStack Start** (PRD pin, 1.168.39) | **Rejected** | RC status + Node >= 22.12 server runtime + SSR/server features all out of scope; its own docs recommend Router alone for SPAs (research Open Question 1) |
| **react-router-dom 7.18.2** | **Rejected** | The PRD pins the TanStack family; Router keeps that investment and adds code-based type-safe routing without the server half |

## Consequences

- **The build tier emits static `dist/` only** — no server runtime, no SSR
  pipeline. Deployment is static-file hosting (ROADMAP SC4).
- **Code-based routes stay for the spike**; Phase 3+ may adopt TanStack's
  file-based routing codegen (`routeTree.gen.ts`) without changing this ADR —
  that is a routing-mechanics choice inside the same framework.
- **This decision is revisited only on a product-level scope change** — if the
  product later gains server features (auth, sync, shared documents), Start is
  re-adopted per the decision line above; the PRD's server-less assumptions
  (REQUIREMENTS.md out-of-scope table) are what keep it rejected today.
- **Phase 2+ scaffolding follows the SPA architecture** — Dexie, Zustand, and
  the document renderer are client-only; no route guards for browser APIs are
  needed (a permanent bug class a pure SPA never has — research Pitfall 12).
