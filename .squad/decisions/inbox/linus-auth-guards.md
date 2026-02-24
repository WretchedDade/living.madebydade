# Decision: Auth Guard Pattern for Bills

**Author:** Linus (Backend Dev)
**Date:** 2026-02-24
**Issue:** #4 (R3: Auth Guards on All Bills Operations)
**PR:** #32

## Decision

All public Convex queries and mutations in `bills.ts` and `billPayments.ts` now require authentication via `ctx.auth.getUserIdentity()` and use `identity.subject` as the userId for ownership scoping.

## Key Choices

1. **userId added to both `bills` and `billPayments` tables** — billPayments carries its own userId rather than relying on a join through bills. This allows direct ownership checks without extra DB reads.

2. **Internal functions left unguarded** — `listWithPayments`, `markBillPaid`, `insertBillPayment`, and `createUpcomingPayments` are internal-only (used by cron jobs) and don't go through auth.

3. **Post-fetch filtering for indexed billPayment queries** — `listUnpaid` and `listRecentlyPaid` use existing compound indexes (`byUnpaidDue`, `byUnpaidAutoDue`, `byDatePaid`) and filter by userId after fetching. Prefixing those indexes with userId would break internal queries. The `list` query uses the `byUserId` index directly.

4. **Share-aware filtering deferred** — Strict single-owner enforcement only. R7 will add share-aware access.

## Impact

- All team members should be aware that creating bills or billPayments now requires a `userId` field.
- Frontend mutations to `upsertBill` do NOT need to pass `userId` — it's set server-side from the auth identity.
