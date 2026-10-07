# Editing a Paperchaser workspace with an agent

Paperchaser keeps everything in the browser. To let an agent such as Claude Code or Codex work on your data, move it through a file:

1. In the app, open **Settings → Backup and import → Download backup**. You get `paperchaser-backup-YYYY-MM-DD.json`.
2. Put the file in this repository (for example `workspace.json`, which you should not commit) and ask the agent to edit it.
3. In the app, **Import** the edited file and choose **Restore backup**. The app downloads a backup of your current data first, then replaces everything with the file.

Single projects work the same way: **Export project** on a project page, edit, then import it (you choose Replace, Skip or Import as copy).

## Validate before importing

The file must match [`workspace.schema.json`](./workspace.schema.json). The app validates every import with the same schema and refuses invalid files and files from a newer app version. Regenerate the schema after changing the data model with `pnpm schema:update`.

## File shape

```text
{
  "format": "paperchaser-workspace",
  "version": 1,
  "projects":  [ { id, title, state, archived, clientId?, feeMinor?, ... } ],
  "clients":   [ { id, name, contactPerson, email, billingAddress[], taxId, archived } ],
  "documents": [ { id, projectId, type, status, number, blocks?, lineItems, ... } ],
  "assets":    [ { id, dataUrl, width, height } ],
  "counters":  [ { type, prefix, next, yearlyReset, year? } ],
  "company":   { name, address[], email, logo, taxId? }
}
```

- Money is always an **integer in minor units** (cents): `120000` is 1,200.00 EUR. Tax rates are minor units of a percent: `1900` is 19%.
- Rich text is an array of nodes: `[{ "type": "paragraph", "content": [{ "type": "text", "text": "Hello" }] }]`. A `{ "type": "placeholder", "text": "Client name" }` node marks something still to fill in.
- Documents are made of `blocks` (heading, richText, keyValue, table, steps, metrics, chart, rating, checklist, image, signature, paymentSchedule, parties, lineItems, totals). Money documents keep their line items in `lineItems`; the `lineItems` and `totals` blocks only mark where they print.
- Images are `data:` URLs or `asset:<id>` references into `assets`. Never use remote `http(s)` URLs.

## Rules an agent must follow

**Only edit drafts.** A document whose `status` is not `"draft"`, or that has a `frozen` field, has been sent. Its content and numbers are the legal record. Do not change it; corrections go through a credit note made in the app.

**Never invent or change numbers.** `number` is assigned by the app when a document is finalized, from `counters`. Leave `number` as `""` on drafts and do not edit `counters`.

**Do not touch the money trail.** Leave `payments`, `frozen`, `rev`, `creditFor`, `receiptFor`, `reminderFor`, `scheduleRef`, `revisionOf`, `revisionBase`, `revision` and `supersededBy` exactly as they are.

**Keep ids stable.** Change content, not `id` or `projectId`. New blocks or line items need a new unique `id` (a UUID is fine).

**Keep the currency.** Do not change `currency` on any document; it is locked once a money document is sent.

**Prefer the project for shared data.** The client name and address, fee, currency, locale and tax mode come from the project and its client. Change them there, not on each document.
