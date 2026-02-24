# Danny — History

## Project Context

**App:** Living.MadeByDade — Personal finance tracker
**Owner:** Dade Cook
**Stack:** React, Vite, TypeScript, Convex, Clerk, Plaid, Tailwind CSS
**Purpose:** Track bills, due dates, and spending money to help make smarter financial choices

## Learnings

### Code Review — Full Architectural Review (2025)

**Key File Paths:**
- Schema: `convex/schema.ts`
- Convex functions: `convex/bills.ts`, `convex/billPayments.ts`, `convex/transactions.ts`, `convex/accounts.ts`, `convex/plaidItems.ts`, `convex/activity.ts`, `convex/cashCreditSummaries.ts`, `convex/migrations.ts`
- HTTP routes (webhooks): `convex/http.ts`
- Auth config: `convex/auth.config.ts`
- Frontend routes: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/bills.tsx`, `src/routes/summaries.tsx`, `src/routes/bank/setup.tsx`
- Hooks: `src/hooks/use-spending-money.ts`, `src/hooks/use-user-metadata.ts`
- Components: `src/components/layout/AppLayout.tsx` (active), `src/components/app-layout.tsx` (stale duplicate)
- Types: `src/types/activity.ts`, `src/utils/guards.ts`, `src/utils/formatters.ts`

**Architecture Patterns:**
- TanStack Router with file-based routing and context-based prefetching
- Convex as backend (queries, mutations, actions, internalMutation, internalAction, internalQuery)
- Clerk auth with ConvexProviderWithClerk pattern at root
- Plaid integration via actions + webhook handler
- Cash vs Credit summary pipeline using incremental deltas on create/update/delete
- Migrations framework via @convex-dev/migrations for schema evolution

**Known Issues Found:**
- `any` usage in multiple frontend files (team rule violation)
- `v.any()` in `convex/activitySchema.ts` (before/after fields)
- Plaid webhook at `convex/http.ts` has no signature verification (security gap)
- `convex/bills.ts` queries/mutations have no auth checks
- Duplicate unused import in `convex/schema.ts` line 6
- Duplicate `fetchNewTransactionSyncData` in both `convex/transactions.ts` and `convex/plaidHelpers.ts`
- `var` keyword used in `convex/users.ts:10` and `convex/billPayments.ts:216`
- Stale duplicate layout: `src/components/app-layout.tsx` (imports non-existent `~/components/user-avatar-card`)
- `convex/accounts.ts:63` parameter named `__dirname` instead of `ctx`

### Revamp Plan — Architecture Decisions (2025-02-23)

**Decision: Integer cents for all currency storage.**
All `v.float64()` currency fields will be migrated to `v.number()` storing integer cents. This eliminates floating-point rounding errors. Conversion happens at boundaries: Plaid ingestion (`Math.round(amount * 100)`) and frontend display (`(cents / 100).toFixed(2)`). Affects: `bills.amount`, all `cashCreditSummaries` fields, `transactions.amount`.

**Decision: Bills scoped by userId with auth guards.**
Adding `userId: v.string()` to bills table with a `byUserId` index. All public queries/mutations in `bills.ts` and `billPayments.ts` must verify authenticated user ownership. This is a P0 security fix — currently bills have zero auth.

**Decision: User sharing via `userShares` table.**
Model: `{ ownerId, sharedWithId, permissions: "read" | "write" }`. Shared helper `getAccessibleUserIds(ctx)` returns the union of the current user and any owners who granted them access. All data queries use this for filtering.

**Decision: Plaid webhook JWT verification.**
Must verify `Plaid-Verification` header using Plaid's webhook verification key endpoint before processing any webhook. Current handler trusts all POST requests blindly.

**Decision: Replace `v.any()` with typed unions.**
`activitySchema.ts` before/after fields changed from `v.any()` to `v.union(v.string(), v.number(), v.boolean(), v.null())`.

**Decision: Configurable pay schedule.**
New `userSettings` table replaces hardcoded 15th + EOM payday logic in `use-spending-money.ts`.

**Key file inventory for revamp:**
- Schema: `convex/schema.ts` (bills needs userId, currency fields need integer migration)
- Auth gaps: `convex/bills.ts`, `convex/billPayments.ts` (zero auth on all endpoints)
- Security: `convex/http.ts` (webhook unverified)
- Currency bug: `src/components/AddBillForm.tsx`, `EditBillForm.tsx` (parseFloat corrupts commas)
- `any` violations: 11+ locations across frontend (see revamp plan R19 for full list)
- Duplicate code: `fetchNewTransactionSyncData` in both `transactions.ts` and `plaidHelpers.ts`
- Dead code: `src/components/app-layout.tsx` (stale), gamification (XP/levels/quests)
