# Deferred Items — Phase 01, Plan 01

Out-of-scope discoveries logged per executor scope-boundary rule (do not fix here).

| # | Found during | Item | File | Disposition |
|---|--------------|------|------|-------------|
| 1 | Task 3 | `react/only-export-components` warning (warn-only, non-blocking): `buttonVariants` const exported alongside the Button component breaks Fast Refresh for that file | `src/components/ui/button.tsx:58` | shadcn@4.16.2 base-nova generated code — regenerate/replace via shadcn CLI when the component set is customized in a later phase (Phase 4 editing UX) |
