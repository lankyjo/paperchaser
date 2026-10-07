# ADR 0003: Header and footer presets per template

**Status:** Accepted
**Date:** 2026-10-07

The header/footer presets (standard, banner, compact) were made for the old single layout. The new templates own their header and footer regions, so a preset only applies where the template has a plain header to restyle.

| Template | Standard | Banner | Compact |
|---|---|---|---|
| Blank | apply | apply | apply |
| Minimal | apply | apply | apply |
| Swiss | apply | apply | apply |
| Noir Ledger | hide | hide | hide |
| Atelier | hide | hide | hide |
| Statement | hide | hide | hide |
| Correspondence | hide | hide | hide |

Hidden means the preset picker is not shown for that template and any stored preset is ignored when rendering. Colors and fonts still apply in every template.
