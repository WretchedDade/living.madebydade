# Living — Rebuild Plan

A clean-slate rebuild of the bills/spending tracker. Goal: keep the things that actually help me make decisions, drop the things that just look impressive.

## Goals

- Know what bills are coming up and when they're due
- Know which bills auto-pay vs. need manual payment, and what's been paid this month
- See current account balance(s)
- Answer one question fast: **"Will my money cover bills until next paycheck, and how much is left?"**

## Non-goals

- Real-time multi-user collaboration
- General budgeting/forecasting beyond the next paycheck
- Spending analytics, category breakdowns, trends — the existing app accumulated these and they were noise
- Anything that requires explaining a formula to understand the answer

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React + TypeScript | Tailwind for styling. No design system framework. |
| API | ASP.NET Core minimal API (.NET 9) | Single project. EF Core for data access. |
| DB | SQLite via EF Core, with Litestream replication to Azure Blob | Single-user app fits in a SQLite file. Cheap, simple, durable enough. |
| Auth | Microsoft Entra External ID (free tier) OR cookie auth on a single-user table | Lean toward Entra so I learn it. No Clerk. |
| Bank data | Plaid (keep — current cost is negligible) | Server-side only. Webhook for transaction updates. |
| Orchestration | .NET Aspire AppHost | Local dev: AppHost orchestrates API + Vite. Publish: `aspire publish` → Azure Container Apps + Static Web Apps. |
| Hosting | Azure (use existing credits, fall back to free tier) | API on Azure Container Apps (consumption, scale-to-zero). Frontend on Azure Static Web Apps free tier. SQLite file lives on the ACA container with Litestream pushing to Blob. |
| Observability | Aspire dashboard locally; Application Insights free tier in Azure | OTel out of the box via Aspire. |

### Why Aspire

- Local dev parity with prod: one `aspire run` spins up API, frontend, and any future dependencies (Plaid mock, Postgres if I outgrow SQLite, etc.)
- `aspire publish` generates the deployment artifacts — less hand-rolled IaC
- Built-in OTel/dashboard makes the "what's slow / what's failing" answer obvious from day one

## Domain model (sketch)

```
User
  - id
  - email
  - timezone
  - paySchedule (semimonthly/biweekly/weekly/monthly)
  - payDays (int[])
  - billLeadDays (default 3)

Bill
  - id, userId
  - name
  - amount (cents)
  - dueDayRule (DayOfMonth | EndOfMonth | DayOfWeek)
  - frequency (monthly/biweekly/weekly/yearly)
  - autoPay (bool)
  - active (bool)

BillPayment              -- one row per occurrence
  - id, billId
  - dateDue
  - dateMarkedPaid?
  - amountPaid (cents)?
  - source (manual | autopay | inferred-from-transaction)

Account                  -- mirrored from Plaid
  - id, userId
  - plaidAccountId
  - name, mask
  - subtype (checking/savings/credit)
  - balanceAvailable, balanceCurrent
  - balanceUpdatedAt

PlaidItem
  - id, userId
  - accessToken (encrypted)
  - institutionName
  - cursor (for transactions sync)

Transaction              -- only what's needed; no aggregates
  - id, accountId
  - plaidTransactionId
  - date, authorizedDate
  - amount (cents)
  - merchantName, name
  - pending
```

### Spending money — server-computed, versioned

The pain point in the old app was that the calc lived in a React hook. Every UI change risked changing the math.

Here, the API exposes:

```
GET /api/spending-forecast
  → {
      asOf,
      formulaVersion: "v1",
      checkingBalance,
      nextPaycheckDate,
      billsBeforeNextPaycheck: [{ name, amount, dateDue, effectiveDate }],
      totalBillsBeforeNextPaycheck,
      spendingMoney
    }
```

- Formula lives in one place, behind one DTO
- Versioned so I can introduce a v2 without breaking v1 callers
- Trivially testable in C# (no React Testing Library gymnastics)
- Frontend just renders it

## Pages (v1)

1. **Home** — `SpendingForecast` card (balance, bills due before paycheck, money left, payday) + upcoming bills list + accounts list. That's the entire page.
2. **Bills** — list/edit bills, mark paid, see paid history.
3. **Settings** — pay schedule, lead days, link/unlink Plaid items.

That's it for v1. No charts, no breakdowns, no burndown.

## Cost model

Estimated monthly cost in Azure with current usage pattern (single user, low traffic):

| Service | Cost |
|---|---|
| Azure Static Web Apps (Free) | $0 |
| Azure Container Apps (consumption, scale-to-zero) | ~$0–$2 |
| Azure Blob Storage (Litestream backup) | <$0.10 |
| Application Insights (free tier, 5GB/mo) | $0 |
| Plaid | $0 (current) |
| **Total** | **<$3/mo, fully covered by Azure credits** |

## Migration / cutover

- **Don't migrate data.** Personal finance — easier to re-link Plaid and import the last few months of transactions fresh than to write a migration tool.
- Keep `living.madebydade` running on `main` until rebuild is on parity.
- When ready: point the domain at the new app, archive the old branch.

## Open questions

- [ ] SQLite + Litestream vs. PostgreSQL Flexible Server (Burstable B1ms is ~$13/mo, not free but more familiar). Lean SQLite for v1, escape hatch to Postgres if I need it.
- [ ] Entra External ID vs. cookie auth on a single-user table. Entra is more learning, cookie is more pragmatic for a single user.
- [ ] React Router vs. TanStack Router. Current app uses TanStack Start; for a non-SSR app, plain React Router + Vite is simpler.
- [ ] Server state: TanStack Query vs. just `fetch` in a small app. Probably TanStack Query — caching is genuinely useful even at this scale.
- [ ] Where does the Plaid webhook land in scale-to-zero? ACA cold start on webhook = potential delay. Acceptable for personal use, but worth noting.

## Out of scope for v1 (revisit later)

- Multi-user
- Mobile app
- Email/SMS reminders
- Budget items (the prorated "groceries, gas, etc." concept)
- Charts of any kind
- Credit card balance tracking beyond "this is the balance right now"
