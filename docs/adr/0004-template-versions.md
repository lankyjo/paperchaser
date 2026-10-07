# ADR 0004: Template versions

**Status:** Accepted
**Date:** 2026-10-08

A sent document must keep the look it was sent with. A finalized document records `frozen.templateVersion`, and every page gets the class `tpl-v<version>` next to `tpl-<template>`.

To change a template:

1. **Colors, fonts or spacing (tokens).** Append a new version to `TEMPLATE_VERSIONS` in `src/document/tokens.ts`. Never edit a published version. A unit test compares a fingerprint of every published version and fails if one changes.
2. **Layout or CSS.** Write the new rule for the current version. Keep the old look for older documents under the old version class, for example `.tpl-statement.tpl-v1 .statement-amount { ... }`. Bump the token version in the same change, so new documents get the new class.

Drafts always use the current version. Only finalized documents keep an older one.
