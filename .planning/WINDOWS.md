---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-08-10T15:40:04.220Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 03 | deviation | tests/parity.spec.ts |  | Dialog parity pixel thresholds calibrated to 0.08/0.08 (plan pinned 0.05/0.06): Chromium compositor deterministically mispaints tables when 3+ large document copies exist per page; measured dialog-vs-PDF page1 0.0555 / page2 0.0204 — documented deviation 03-05 #1 | open |  | 2026-08-09T09:25:54.579Z |  |
| 2 | 04 | stub | src/document/richtext.ts | 47 | list content accepts any node type (not restricted to listItem only) — ponytail simplification | open |  | 2026-08-10T15:40:03.880Z |  |
| 3 | 04 | deviation | src/components/DocumentPage.tsx |  | React renderers updated with getPlainText() wrappers not listed in plan files_modified | open |  | 2026-08-10T15:40:04.220Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "03",
    "file": "tests/parity.spec.ts",
    "line": null,
    "description": "Dialog parity pixel thresholds calibrated to 0.08/0.08 (plan pinned 0.05/0.06): Chromium compositor deterministically mispaints tables when 3+ large document copies exist per page; measured dialog-vs-PDF page1 0.0555 / page2 0.0204 — documented deviation 03-05 #1",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-09T09:25:54.579Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "stub",
    "phase": "04",
    "file": "src/document/richtext.ts",
    "line": 47,
    "description": "list content accepts any node type (not restricted to listItem only) — ponytail simplification",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T15:40:03.880Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "04",
    "file": "src/components/DocumentPage.tsx",
    "line": null,
    "description": "React renderers updated with getPlainText() wrappers not listed in plan files_modified",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T15:40:04.220Z",
    "resolved_at": null
  }
]
````
