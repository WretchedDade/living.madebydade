# Decision: Integer Cents for All Currency Storage

**Author:** Linus (Backend Dev)
**Date:** 2026-02-24
**Issue:** #5
**PR:** #34

## Decision

All money values in the database are stored as **integer cents** (`v.number()`), not floating-point dollars (`v.float64()`).

- 1200 means $12.00
- -350 means -$3.50

## Rationale

Floating-point arithmetic causes rounding errors (e.g., `0.1 + 0.2 !== 0.3`). For a finance app, this erodes user trust. Integer cents eliminate this entire class of bugs.

## Rules

1. **Schema**: All money fields use `v.number()` storing integer cents
2. **Ingestion boundary**: Plaid amounts are converted with `Math.round(amount * 100)` immediately in `toLeanTransaction` and `toTransactionSchema`
3. **Backend arithmetic**: Use only addition, subtraction, and `Math.abs` — no division or multiplication of money values
4. **Frontend display**: Convert cents to dollars at the UI layer (divide by 100) — this is Rusty's responsibility
5. **New money fields**: Must always store integer cents, never float dollars

## Migration

Run `runIntegerCentsMigration` to convert existing data. It converts bills and transactions, then rebuilds cash/credit summaries.
