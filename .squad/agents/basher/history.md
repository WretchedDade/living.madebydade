# Basher — History

## Project Context

**App:** Living.MadeByDade — Personal finance tracker
**Owner:** Dade Cook
**Stack:** React, Vite, TypeScript, Convex, Clerk, Plaid, Tailwind CSS
**Purpose:** Track bills, due dates, and spending money to help make smarter financial choices

## Learnings

### Bug Patterns
- **Floating Point Math:** The entire app uses `v.float64` for money. This causes precision errors.
- **Frontend Parsing:** `parseFloat` is used on formatted strings (e.g., "1,000.00"), which results in data corruption (parses as 1).
- **Security:** Webhooks (Plaid) are missing signature verification.

### Edge Cases
- **Pay Schedule:** `useSpendingMoney` assumes a fixed 15th/Last-day pay schedule. This will be wrong for many users.
- **Bill Due Dates:** `dayDue` is stored as float but treated as int.

### Key File Paths
- `convex/schema.ts`: Defines `amount` as `v.float64`.
- `convex/cashCreditSummaries.ts`: Performs direct float arithmetic.
- `src/components/AddBillForm.tsx`, `src/components/EditBillForm.tsx`: Contains the `parseFloat` bug.
- `convex/http.ts`: Missing webhook verification.

