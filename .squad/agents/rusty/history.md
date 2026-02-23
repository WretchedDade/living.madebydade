# Rusty — History

## Project Context

**App:** Living.MadeByDade — Personal finance tracker
**Owner:** Dade Cook
**Stack:** React, Vite, TypeScript, Convex, Clerk, Plaid, Tailwind CSS
**Purpose:** Track bills, due dates, and spending money to help make smarter financial choices

## Learnings

### Code Review — Any Type Violations (2026-02-23)

**Finding:** Team rule violation — `any` type used in multiple frontend files. Route from Danny's architectural review.

**Locations:**
- `src/routes/bills.tsx:25-26,71,186`
- `src/components/EditBillForm.tsx:7`
- `src/types/activity.ts:85`
- `src/routes/bank/success/$itemId.tsx:77,91,101`
- `src/components/feedback/SciFiToast.tsx:51`
- `src/components/RecentActivitySection.tsx:3`
- `src/lib/billFieldFormatters.ts:5`
- `src/components/RecentActivityViews/ResponsiveKeyValueTable.tsx:5-6,12`

**Action:** Replace all `any` with proper types. Use union types or generics as appropriate.

### Code Review — parseFloat Bug (2026-02-23)

**Finding:** Critical data corruption bug in form parsing (from Basher's quality review).

**Locations:** `src/components/AddBillForm.tsx`, `src/components/EditBillForm.tsx`

**Issue:** `parseFloat("1,200.00")` stops at comma, saves as "1.00". Destroys amounts >$1,000.

**Fix:** Strip commas before parsing: `parseFloat(value.amount.replace(/,/g, ""))`
