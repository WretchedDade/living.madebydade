# Convex indexing plan

This plan lists the exact indexes to add to your Convex tables, the query updates to ensure they’re used, and how to apply and verify changes. It also includes follow-ups to eliminate remaining scans and keep performance healthy as data grows.

## Objectives

- Remove full scans from hot queries by aligning indexes to filter/order patterns.
- Replace in-memory sorts with index-backed ordering where feasible.
- Keep the index set minimal and targeted per table.
- Add a clean follow-up path to replace array-field scans with a normalized lookup table.

## What exists today

- `transactions`
    - Indexes: `authorizedDate` (['authorizedDate']), `date` (['date']).
- `transactionSummaries`
    - Index: `byUserPeriodStart` (['userId','period','startDate']).
- All other tables have no indexes.

## Indexes to add (by table)

Add these to `convex/schema.ts`.

- bills
    - none (queries scan all bills by design)

- billPayments
    - `byBillId`: ['billId']
    - `byDatePaid`: ['datePaid']
    - `byUnpaidDue`: ['datePaid', 'dateDue']
    - `byUnpaidAutoDue`: ['datePaid', 'isAutoPay', 'dateDue']

- activity
    - `byUserIdTimestamp`: ['userId', 'timestamp']
    - `byTargetIdTimestamp`: ['targetId', 'timestamp']
    - `byTimestamp`: ['timestamp']

- plaidItems
    - `byUserId`: ['userId']
    - `byItemId`: ['itemId']

- transactions
    - `byTransactionId`: ['transactionId']

- transactionSummaries
    - already present: `byUserPeriodStart` (['userId','period','startDate'])

## Query updates to use indexes

Update these queries to call `withIndex(...)` so Convex leverages the indexes.

- bills
    - `convex/bills.ts` › listWithPayments:
        - Use `withIndex('byBillId', q => q.eq('billId', bill._id))` to fetch payments for each bill.

- billPayments
    - `convex/billPayments.ts` › listUnpaid:
        - includeAutoPay=true: `withIndex('byUnpaidDue', q => q.eq('datePaid', undefined)).order('asc')`
        - includeAutoPay=false: `withIndex('byUnpaidAutoDue', q => q.eq('datePaid', undefined).eq('isAutoPay', false)).order('asc')`
        - Then remove the client-side sort by due date.
    - `convex/billPayments.ts` › listRecentlyPaid:
        - `withIndex('byDatePaid', q => q.gte('datePaid', '0')).order('desc').take(50)` to get most-recent paid without sorting in memory.

- activity
    - `convex/activity.ts` › listRecentActivity:
        - If `userId` provided: `withIndex('byUserIdTimestamp', q => q.eq('userId', args.userId)).order('desc').take(limit)`
        - Else global: `withIndex('byTimestamp').order('desc').take(limit)`
    - `convex/activity.ts` › listActivityForTarget:
        - `withIndex('byTargetIdTimestamp', q => q.eq('targetId', args.targetId)).order('desc').take(limit)`

- plaidItems
    - `convex/plaidItems.ts`:
        - get: `withIndex('byUserId', q => q.eq('userId', subject))`
        - getById/internalGetById/updateTransactionCursor: `withIndex('byItemId', q => q.eq('itemId', itemId))`

- transactions
    - `convex/transactions.ts`:
        - internalGetByTransactionId / updateTransaction / deleteTransaction: `withIndex('byTransactionId', q => q.eq('transactionId', ...)).first()`
        - prune jobs already use `authorizedDate` and `date` indexes.

## Apply changes

1. Update `convex/schema.ts` with the indexes above.
2. Update the listed queries to use `withIndex` calls.
3. Restart dev server to apply indexes and reload code:

```bash
npx convex dev
```

## Verify quickly

- billPayments
    - Unpaid lists return fast and in due-date order; no client-side sort.
    - Recently paid returns top 50 by `datePaid` desc; no client-side sort.
- transactions
    - Fetch/update/delete by `transactionId` serve via index.
- activity
    - User and target feeds paginate in timestamp desc via indexes; global feed uses `byTimestamp`.
- plaidItems
    - List by user and fetch by itemId avoid full scans.

---

## Follow-ups (high value)

These remove remaining scans and tighten performance. Plan includes contracts and steps.

### 1) Normalize account lookup to avoid array scans

Problem

- `plaidItems.accounts[].id` is scanned to find `userId` by `accountId` in:
    - `plaidItems.getUserIdByAccountId`
    - `migrations.buildTransactionSummaries`
    - `transactions.*` flows indirectly use `getUserIdByAccountId`

Solution: add a small `plaidAccounts` table

- Schema (proposed):
    - `plaidAccounts`: { accountId: string, itemId: string, userId: string }
- Indexes:
    - `byAccountId`: ['accountId'] (primary lookup)
    - Optional: `byItemId`: ['itemId'] (cleanup, maintenance)
    - Optional: `byUserId`: ['userId'] (user-centric admin views)

Implementation steps

- Add table + indexes in `schema.ts`.
- On link/create (`plaidItems.link` / `plaidItems.create`), insert one `plaidAccounts` row per account in `accounts`.
- Backfill existing data:
    - Internal script or migration: iterate `plaidItems`, insert missing `plaidAccounts` rows.
- Replace lookups:
    - `plaidItems.getUserIdByAccountId` -> query `plaidAccounts` with `withIndex('byAccountId', q => q.eq('accountId', accountId)).first()` and return `userId`.
    - `transactions.createTransaction` / `updateTransaction` / `deleteTransaction`: call the new internal lookup (or inline the same query) instead of scanning items.
    - `migrations.buildTransactionSummaries`: replace the inline `plaidItems` scan with a `plaidAccounts` lookup.

Tiny contract

- Input: `accountId` (string)
- Output: `userId | undefined` (string)
- Behavior: O(log n) lookup via index, no scans; defined for all accounts present in `plaidItems`.

### 2) Tighten sorting/pagination where possible

- Prefer index-backed `order('asc'|'desc')` with `.take()` or `.paginate()` over `collect()` + `sort()`.
- For feeds (activity, recently paid), always set order + limit via index to bound server work and network payloads.

### 3) Data lifecycle (optional but recommended)

- With `activity.byTimestamp`, consider pruning very old activity (e.g., keep last 90 days) via a periodic internal mutation/migration using the timestamp index.
- Continue pruning transactions (already implemented) to keep indexes lean.

---

## Mapping to requirements

- Identify needed indexes from all queries: done (see Indexes to add).
- Note existing indexes and coverage: done (see What exists today).
- Provide concrete index definitions and code updates: done (by table sections above).
- Include follow-ups with concrete steps and contracts: done (Follow-ups section).

## Next steps

- Commit `schema.ts` index changes and query updates.
- Roll out follow-up 1 (`plaidAccounts`) to eliminate the remaining scans.
- Monitor query latency and Convex logs; adjust limits and pagination as data grows.
