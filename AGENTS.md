# Paperchaser — coding rules

Non-negotiable. `pnpm check:conventions` enforces what a tool can check; the review checklist below covers the rest.

## 1. Comments

- One line maximum. No multi-line `/** ... */` blocks, no stacked `//` lines.
- Describe the code on that line or the block below it: what it does or why it is non-obvious.
- Never reference planning artifacts: no decision IDs (`D-12`, `T-04-01`), ADRs, `PITFALLS`, `RESEARCH`, phase numbers or plan files. If the reason matters, state the reason itself.
- No comment is better than a comment that restates the code.

## 2. Structure

- `src/document/` — pure domain: schemas, totals, money, rich text. No React, DOM globals or Dexie.
- `src/db/` — persistence (Dexie) only. No React components.
- `src/components/` — React components, grouped by feature folder; `ui/` holds shared primitives.
- `src/hooks/` — shared custom hooks; a hook used by one feature lives in that feature's folder.
- `src/lib/` — small framework-agnostic helpers.
- `src/routes/` — route components only; they compose, they don't hold logic.
- Tests sit next to the code in `__tests__/`.

## 3. Reuse, components and hooks

- Logic that is reused, or that holds state or effects, goes in a named custom hook (`useX`) or a reusable component — never scattered inline in JSX or event handlers.
- Don't wrap two trivial lines in a hook; extract once it is reused or stateful.
- Never call `useEffect` or `useLayoutEffect` directly in a component (`.tsx`); effects live in custom hooks. Use derived state, event handlers, or `useMountEffect` for one-time external sync.
- One component per file; keep files and functions short (lint enforces limits).

## 4. Naming

- A folder holds exactly what its name says. A file is named for its main export.
- Folders: `kebab-case` (plus `__tests__`).
- React components: `PascalCase.tsx` (except `src/components/ui/`, which keeps shadcn's `kebab-case.tsx`). Hooks: `useCamelCase.ts`. Other modules: `camelCase.ts`. Tests: `<name>.test.ts`, Playwright: `<name>.spec.ts`.
- Function names say what they return or do (`computeTotals`, `parseToMinor`), never vague (`handle`, `process`, `utils2`).

## Review checklist (things tools can't check)

- [ ] Every comment is one line and describes code, not history.
- [ ] Nothing duplicated that an existing component, hook or helper already does.
- [ ] No logic scattered inline in JSX or handlers that should be a hook or component.
- [ ] Each folder still holds only what its name says; each file's name matches its export.
- [ ] Names describe behaviour; a reader can find any feature from the folder tree alone.
