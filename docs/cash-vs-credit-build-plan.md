# Cash vs Credit Summary — Greenfield Build Plan

Build the summary pipeline from transactions only, separating cash spending from credit card movement. This plan assumes no backwards compatibility is required (existing summaries are empty).

## Goals

- Compute accurate summaries from the ground up using transactions as the single source of truth.
- Separate “cash spending” (checking/savings) from “credit card movement” (purchases/payments/interest/refunds).
- Avoid double-counting from internal transfers and card payments.
- Provide reconciliation checks so numbers are auditable.

## Definitions

- Cash accounts: checking + savings.
- Credit accounts: credit cards (line of credit).
- External income: payroll, merchant refunds, interest, etc.
- Internal transfers: checking ↔ savings, and cash → credit card payments.
- Credit principal delta: purchases (increase) − payments/refunds (decrease). Interest/fees are expenses, not principal.

## Target Outputs per Period

- Cash
    - incomeExternal
    - spendingCash (cash-basis; excludes internal transfers and CC payments)
    - savingsContributions (net into savings)
    - netCashChange (delta of checking + savings balances)
- Credit
    - purchasesCredit (purchase-basis on credit accounts)
    - paymentsCredit (principal-only portion from cash to credit)
    - interestFeesCredit (expenses on credit accounts)
    - refundsCredit (credits/returns on credit accounts)
    - principalDelta (purchases − payments − refunds)
- Meta/Recon
    - externalNetFlow and integrity flags

## Data Model (Convex)

Repo files: `convex/schema.ts`, `convex/transactionSchema.ts`, `convex/transactionSummaries.ts`, `convex/cashCreditSummaries.ts`, `convex/plaidHelpers.ts`, `convex/plaidItems.ts`, `convex/migrations.ts`, `convex/crons.ts`.

1. Accounts

- Derive and persist `accountType: 'checking' | 'savings' | 'credit'` onto `plaidAccounts` from Plaid `type/subtype` during link/create.
- Index: `byUserIdAccountType` over `(userId, accountType)` for fast grouping.

2. Transactions (source of truth)

- Ensure: `accountId`, `userId`, `accountType`, `amount` (signed), `date`, `authorizedDate`, categories, `name`.
- Detection flags to add (initial heuristic-only, can be backfilled later):
    - `transferGroup?: string`
    - `matchesTransactionId?: string`
    - `isInternalTransfer?: boolean`
    - `isCreditCardPayment?: boolean`
    - `isRefundOrReversal?: boolean`
    - `isInterestOrFee?: boolean`
- Indexes: keep existing `authorizedDate`, `date`, `byTransactionId`; future: `(userId, accountType, date)` and `(userId, transferGroup)` if/when pairing is added.

3. Summaries (new canonical collection)

- Existing: `transactionSummaries` — keep for generic totals.
- New: `cashCreditSummaries` for cash vs credit split.
- Key: `(userId, periodStart, periodEnd)`; Index: `(userId, periodStart)`.
- Payload includes Target Outputs + optional `extNetFlow`, `buildVersion`.

## Computation Rules

General

- Exclude `isPending=true`.
- Use detection flags to exclude internal transfers from cash income/spend. Still count them for savingsContributions and for credit payments.

Cash

- incomeExternal: inflows on cash accounts that aren’t internal transfers or CC payment refunds; include interest on cash.
- spendingCash: outflows from cash accounts to external counterparties; exclude CC payments and cash↔savings transfers.
- savingsContributions: net inflow to savings (in minus out) from internal transfers.
- netCashChange: sum of balance deltas (checking+savings) to reconcile movements.

Credit

- purchasesCredit: purchases on credit accounts; exclude transfers, interest/fees, and payments.
- paymentsCredit: principal component detected from cash to credit matches.
- interestFeesCredit: interest/fees on credit accounts (expense, not principal).
- refundsCredit: credits on credit accounts (returns/adjustments).
- principalDelta: purchases − payments − refunds (reconcile to statement principal delta when available).

## How to Interpret the Summaries Table

This section explains each column shown in the UI and how to read the numbers. All metrics are reported as positive magnitudes for easier scanning. Where relevant, we also list the underlying field name in `cashCreditSummaries` and the exact formula.

- Cash In (`cashIncomeExternal`)
    - External inflows to cash accounts (paychecks, interest, refunds landing in cash, etc.).
    - Excludes internal transfers and credit-card payments.

- Cash Out (`cashSpending`)
    - Cash-basis spending out of checking/savings to external counterparties.
    - Excludes internal transfers (checking↔savings) and credit-card payments.

- Savings (`cashSavingsContributions`)
    - Net amount you moved into savings this period via internal transfers.
    - Positive means you contributed to savings; negative would mean you pulled from savings.

- Cash Net (computed)
    - What your cash activity would net out to, ignoring timing/statement effects.
    - Formula: Cash In − Cash Out − Savings − CC Payments
    - Uses: `cashIncomeExternal`, `cashSpending`, `cashSavingsContributions`, `ccPayments`.
    - Compare with `cashNetChange` (when present), which is the observed balance delta (checking+savings). Differences point to classification/timing gaps (e.g., late-arriving txns, misdetected transfers).

- CC Purchases (`ccPurchases`)
    - Total purchases made on credit accounts this period (purchase-basis).

- CC Payments (`ccPayments`)
    - Principal portion of payments from cash to credit.
    - This is also subtracted in Cash Net because it leaves your cash accounts.

- CC Interest/Fees (`ccInterestFees`)
    - Interest and fees accrued on credit accounts (expense, not principal). Not part of principal delta.

- CC Refunds (`ccRefunds`)
    - Credits/returns applied to the credit account that reduce principal owed.

- CC Principal Δ (`ccPrincipalDelta`)
    - The net change to your credit principal from activity this period.
    - Formula: CC Purchases − CC Payments − CC Refunds
    - Interpretation:
        - Positive: you increased what you owe (more purchases than payments/refunds).
        - Negative: you paid down your card (payments/refunds exceeded purchases).

### Sign Conventions & Reconciliation Notes

- Values are presented as positive magnitudes in the table for readability. The formulas above encode the directionality (inflows minus outflows, etc.).
- `cashNetChange` (when included) is a reconciliation check derived from balances, while Cash Net is computed from classified transactions. They should be close over stable periods; persistent gaps indicate detection/timing issues to investigate.
- Edge cases (partial payments, balance transfers, cash advances) can affect CC Principal Δ. These are handled via heuristics initially and can be improved with pairing.

## Transfer & Payment Detection

Priority (first positive wins):

1. Provider hints: Plaid categories (transfer/payment), `payment_channel`, name patterns (e.g., “Payment Thank You”).
2. Cross-account match: opposite-signed transactions within N days, |Δamount| ≤ ε, spanning cash→credit → mark as credit payment pair.
3. Internal cash transfers: similar match between checking and savings accounts.
4. Refunds: negative entries on credit accounts matched to a recent merchant purchase or marked as refund.
5. Interest/fees: Plaid categories for interest/fees on credit accounts.

Persist `transferGroup` for auditable, idempotent pairing.

## Build Phases (No Backwards Compatibility)

Phase 1 — Schema & Indexes

- Add/ensure accountType on plaid accounts; attach userId/accountType on transactions at ingest.
- Add detection flag fields (initially unset); add future indexes as needed for pairing.

Phase 2 — Detection Library

- Implement heuristic detection helpers and persist flags to transactions; later add cross-account pairing.
- Backfill detection fields for historical transactions idempotently.

Phase 3 — Summary Engine

- Implement incremental upserts to `cashCreditSummaries` on txn create/update/delete; add backfill runner.
- Compute for historical window (e.g., last 24 months) via migrations runner.
- Store reconciliation metrics and integrity flags later; begin with primary measures.

Phase 4 — Ingestion + Incremental Updates

- During import: assign `userId` and `accountType`; run lightweight detection and update both summaries.
- Scheduled job: prune old txns (existing), and roll forward summaries for the open period; add repair job later.

Phase 5 — UI & API

- Add queries to fetch `cashCreditSummaries`.
- Update dashboard to show:
    - Spending (cash)
    - Savings contributions
    - Credit card (purchases, payments, interest/fees, principal delta)
    - Optional: net cash change and reconciliation status

## Reconciliation & Quality Gates

- Cash: netCashChange ≈ external inflows − cash spending − savingsContributions − paymentsCredit (as cash outflow), within tolerance.
- Credit: principalDelta ≈ change in principal balance for the period (when available).
- Alert and flag summaries where tolerance is exceeded; record reasons.

## Testing

- Unit tests: detection (happy path, partial payments, split amounts, multi-day windows).
- Property tests: reconciliation invariants across synthetic streams.
- Golden fixtures: sanitized real streams to guard against regressions.

## Edge Cases

- Partial/early/late credit card payments.
- Balance transfers and cash advances (credit adjustments, not spending).
- P2P (Venmo/Zelle): external counterparties; not internal unless account owner matches.
- ATM withdrawals: cash conversion, not spending (unless linked to cash expenses; out of scope for now).
- Reversals/duplicates/pending: exclude pending; dedupe reversals prior to summary.

## Operational Notes

- Idempotent backfills with checkpointing per user/period.
- Configurable tolerances per environment.
- Observability: matched/unmatched counts, reconciliation drift, late-arrival repair rate.

## Implementation Checklist

- [x] Accounts: ensure `accountType` and indexes on `plaidAccounts`.
- [x] Transactions: attach `userId` and `accountType` on ingest; add detection fields.
- [ ] Detection library + tests; run backfill for flags.
- [x] Summary computation; write to `cashCreditSummaries` incrementally.
- [ ] Backfill job to build `cashCreditSummaries` from history.
- [ ] API query endpoints and UI widgets for the split view and recon status.
