# Decisions — Living.MadeByDade

## 2026-02-23 — Code Review Session (Danny + Basher)

### Critical Issues — Must Fix Immediately

#### 1. Plaid Webhook Missing Signature Verification
- **Files:** `convex/http.ts`
- **Authors:** Danny, Basher
- **Impact:** CRITICAL — Anyone can POST to `/plaid` and trigger fake transaction syncs. Attacker could corrupt data or flood logs.
- **Action:** Implement `plaid.verifyWebhookSignature()` before processing webhook data.

#### 2. Bills Mutations/Queries Missing Authentication
- **Files:** `convex/bills.ts` (list, upsertBill, deleteBill, getBillById)
- **Author:** Danny
- **Impact:** CRITICAL — Any authenticated user can access/modify any user's bills. No userId check.
- **Action:** Add `ctx.auth.getUserIdentity()` checks to all bill operations. Add userId field to bills table and enforce ownership.

#### 3. parseFloat Data Corruption on Formatted Strings
- **Files:** `src/components/AddBillForm.tsx`, `src/components/EditBillForm.tsx`
- **Author:** Basher
- **Impact:** CRITICAL — `parseFloat("1,200.00")` stops at comma, saves as "1.00". Destroys data for any amount >$1,000.
- **Action:** Strip commas before parsing: `parseFloat(value.amount.replace(/,/g, ""))`

#### 4. Floating-Point Precision Errors in Money Math
- **Files:** `convex/schema.ts` (v.float64), `convex/cashCreditSummaries.ts`, `convex/bills.ts`
- **Author:** Basher
- **Impact:** CRITICAL — Standard float arithmetic causes rounding errors (0.1 + 0.2 ≠ 0.3). Erodes user trust in financial accuracy.
- **Action:** Short-term: Round to 2 decimals after every calculation. Long-term: Migrate to integer-based storage (cents).

### Important Issues — Should Fix This Sprint

#### 5. TypeScript `any` Usage Violates Team Rule
- **Files:** 
  - Frontend: `src/routes/bills.tsx:25-26,71,186`, `src/components/EditBillForm.tsx:7`, `src/types/activity.ts:85`, `src/routes/bank/success/$itemId.tsx:77,91,101`, `src/components/feedback/SciFiToast.tsx:51`, `src/components/RecentActivitySection.tsx:3`, `src/lib/billFieldFormatters.ts:5`, `src/components/RecentActivityViews/ResponsiveKeyValueTable.tsx:5-6,12`
  - Backend: `convex/activitySchema.ts:22-23` (before/after fields)
- **Author:** Danny
- **Action:** Route to Rusty (frontend cleanup) and Linus (backend schema fix). Use proper union types instead of `v.any()`.

#### 6. Duplicate Function: fetchNewTransactionSyncData
- **Files:** `convex/transactions.ts:12-65` (unused) and `convex/plaidHelpers.ts:54-108` (active)
- **Author:** Danny
- **Action:** Remove duplicate from transactions.ts. Verify sync flow calls only plaidHelpers version.

#### 7. Stale Duplicate AppLayout
- **Files:** `src/components/app-layout.tsx` (stale) vs `src/components/layout/AppLayout.tsx` (active)
- **Author:** Danny
- **Issue:** Stale version imports non-existent `~/components/user-avatar-card`
- **Action:** Delete `src/components/app-layout.tsx`

#### 8. Unused Import in Schema
- **File:** `convex/schema.ts:6` imports `v as values` (never used)
- **Author:** Danny
- **Action:** Remove unused import.

#### 9. var Instead of const
- **Files:** `convex/users.ts:10`, `convex/billPayments.ts:216`
- **Author:** Danny
- **Action:** Replace `var` with `const`.

#### 10. Duplicate Import in Transactions
- **File:** `convex/transactions.ts:7` imports `internal as internalApi` (line 4 already imports `internal`)
- **Author:** Danny
- **Action:** Remove redundant import.

#### 11. Hardcoded Pay Schedule
- **File:** `src/hooks/use-spending-money.ts`
- **Author:** Basher
- **Impact:** Assumes 15th and End-of-Month paydays. Wrong for bi-weekly or other schedules.
- **Action:** Make pay schedule configurable per user.

### Minor Issues

#### 12. Misleading Parameter Name
- **File:** `convex/accounts.ts:63` uses `__dirname` as handler param instead of `ctx`
- **Author:** Danny

#### 13. Stale Bank Index Route
- **File:** `src/routes/bank/index.tsx` (placeholder "Hello" component)
- **Author:** Danny

#### 14. Hardcoded Empty userId in logActivityInternal
- **File:** `convex/activity.ts:16` sets `userId: ""`
- **Author:** Danny

#### 15. Hardcoded Level/XP in AppLayout
- **File:** `src/components/layout/AppLayout.tsx:30` hardcodes `level=3, xp=1250, xpMax=2000`
- **Author:** Danny

#### 16. Broken useClerkUser Hook
- **File:** `src/hooks/use-clerk-user.ts` calls non-existent `getUser()` method
- **Author:** Danny

---

## Decision Log

- [2026-02-23] Code review completed. 4 critical + 12 additional issues identified. Escalation path set for Rusty (frontend) and Linus (backend).
