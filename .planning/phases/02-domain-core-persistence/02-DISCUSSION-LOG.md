# Phase 2: Domain Core & Persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-07
**Phase:** 2-Domain Core & Persistence
**Areas discussed:** Money math & rounding; Discounts, shipping & fees; Document types & differences; Currency & import/export

---

## Money math & rounding

| Option | Description | Selected |
|--------|-------------|----------|
| Round per line, then sum | Each line total rounds to cents, then summed; matches how invoices read | ✓ |
| Sum raw, round once | Sum exact line values, round only the grand total | |
| You decide | Agent picks the policy | |

**User's choice:** Round per line, then sum
**Notes:** Rounding happens once per line, never cascades.

| Option | Description | Selected |
|--------|-------------|----------|
| Tax-exclusive, net prices | Unit prices exclude tax; tax added on top | ✓ |
| Tax-inclusive, gross prices | Unit prices include tax; engine backs out tax | |
| Per-document toggle | Document stores a net/gross flag | |

**User's choice:** Tax-exclusive, net prices

| Option | Description | Selected |
|--------|-------------|----------|
| Rounded line net | tax = round(raw line total) × rate, then rounds to cents | ✓ |
| Raw line net | tax = raw line total × rate, rounded once | |

**User's choice:** Rounded line net

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by rate | Tax total breaks down by rate (19%: €X, 7%: €Y) | ✓ |
| Single flat tax total | One summed tax number | |
| You decide | Agent picks the structure | |

**User's choice:** Grouped by rate

---

## Discounts, shipping & fees

| Option | Description | Selected |
|--------|-------------|----------|
| Both levels | Per-line discount + separate document-level discount on subtotal | ✓ |
| Line-level only | Discount only on lines; totals discount derived | |
| Document-level only | Single global discount | |

**User's choice:** Both levels

| Option | Description | Selected |
|--------|-------------|----------|
| Percentage OR flat, per instance | Each discount records kind (percent \| amount) + value | ✓ |
| Percentage only | All discounts are percentages | |
| Flat amount only | All discounts are currency amounts | |

**User's choice:** Percentage OR flat, per instance

| Option | Description | Selected |
|--------|-------------|----------|
| Each with own rate | Shipping/fees line-like with amount + optional tax rate | ✓ |
| Flat, untaxed | Simple flat amounts, no tax | |
| You decide | Agent picks the model | |

**User's choice:** Each with own rate

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple | Array of shipping/fee entries with labels | ✓ |
| One shipping + one fees total | Single amounts per document | |

**User's choice:** Multiple

---

## Document types & differences

| Option | Description | Selected |
|--------|-------------|----------|
| One model + type tag | Single DocumentModel with `type` discriminant | ✓ |
| Separate per-type schemas | Each type its own schema | |

**User's choice:** One model + type tag

| Option | Description | Selected |
|--------|-------------|----------|
| Same fields, semantics differ | Receipt uses identical schema; differences via status | ✓ |
| Receipt is a minimal subtype | Receipt restricts some fields | |

**User's choice:** Same fields, semantics differ

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit status field | `status: draft \| sent \| paid`; watermark derives from status | ✓ |
| Derive from watermark | Watermark is the only state; status inferred | |

**User's choice:** Explicit status field

---

## Currency & import/export

| Option | Description | Selected |
|--------|-------------|----------|
| EUR + JPY only | Small registry exercising 2dp and 0dp policies | ✓ |
| EUR only | Decimal-aware but only EUR registered | |
| Broader set | Several common currencies registered now | |

**User's choice:** EUR + JPY only

| Option | Description | Selected |
|--------|-------------|----------|
| Versioned envelope | `{ format, version, document }` wrapper | ✓ |
| Bare document JSON | Document object with schemaVersion inside | |

**User's choice:** Versioned envelope

| Option | Description | Selected |
|--------|-------------|----------|
| Strict shape, strip unknowns | Required fields validated; unknown fields dropped | ✓ |
| Strict + reject unknowns | Reject any unknown field | |
| Lenient | Coerce/ignore missing fields to defaults | |

**User's choice:** Strict shape, strip unknowns

| Option | Description | Selected |
|--------|-------------|----------|
| Add Zod | Install Zod; schemas are source of truth + boundary guards | ✓ |
| Hand-rolled validators | Plain validation functions, no new dependency | |
| You decide | Agent weighs PRD alignment vs dependency budget | |

**User's choice:** Add Zod

---

## the agent's Discretion

None — all gray areas were resolved by explicit user choice.

## Deferred Ideas

None — discussion stayed within phase scope.
