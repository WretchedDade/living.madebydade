# Decision: userId is required on bills table

**Author:** Linus (Backend Dev)
**Date:** 2026-02-23
**Issue:** #3 — R2: Add userId to Bills Schema + Migration
**PR:** #29

## Context

The `bills` table had no ownership field — all bills were globally visible. This was a critical auth gap identified during code review.

## Decision

- `userId` is a **required** `v.string()` field (not optional), enforcing that every bill must have an owner
- Existing bills are backfilled via migration using the userId from the first `plaidItems` record (safe for single-user app)
- A `byUserId` index is added for efficient filtering

## Implications

- All bill mutations (`upsertBill`, `deleteBill`) must now include `userId` when inserting
- Queries should use the `byUserId` index to scope results to the authenticated user
- Future auth guard work (adding `ctx.auth.getUserIdentity()` checks) should use this field for ownership verification
