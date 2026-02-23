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
