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
| App | Blazor with **static SSR** as default render mode (.NET 9) | Single ASP.NET Core app — Blazor pages, minimal-API endpoints for Plaid webhooks, EF Core for data. No separate frontend. |
| Interactivity | Per-component opt-in (`InteractiveServer` only where needed) | Default is server-rendered HTML. Components like the "mark paid" button or Plaid Link launcher opt in. No app-wide SignalR. |
| Styling | Tailwind CSS via the Tailwind CLI | No design system framework. |
| DB | SQLite via EF Core, with Litestream replication to Azure Blob | Single-user app fits in a SQLite file. Cheap, simple, durable enough. |
| Auth | Microsoft Entra External ID (free tier) OR cookie auth on a single-user table | Lean toward Entra so I learn it. No Clerk. |
| Bank data | Plaid (keep — current cost is negligible) | Server-side only. Webhook for transaction updates. |
| Orchestration | .NET Aspire AppHost | Local dev: AppHost orchestrates the Blazor app + any future deps (Plaid mock, etc.). Publish: `aspire publish` → Azure Container Apps. |
| Hosting | Azure (use existing credits, fall back to free tier) | One Azure Container App (consumption, scale-to-zero) hosts the whole thing. SQLite file lives in the container with Litestream pushing to Blob. |
| Observability | Aspire dashboard locally; Application Insights free tier in Azure | OTel out of the box via Aspire. |

### Why Blazor SSR over React

- **One app, one deploy.** No SPA build pipeline, no API contract to keep in sync, no two languages.
- **Server-rendered by default** — first paint is fast even on ACA scale-to-zero cold start. No hydration cliff.
- **Component model** like React (`<SpendingForecastCard />`, `<UpcomingBillsList />`) but C# end-to-end.
- **Interactivity is opt-in per component**, not all-or-nothing. The 2–3 places that actually need it (mark paid, Plaid Link launch) get `@rendermode="InteractiveServer"`; everything else stays static HTML.

### Why Aspire

- Local dev parity with prod: one `aspire run` spins up the app and any future deps (Plaid mock, Postgres if I outgrow SQLite, etc.)
- `aspire publish` generates the deployment artifacts — less hand-rolled IaC
- Built-in OTel/dashboard makes the "what's slow / what's failing" answer obvious from day one

### Persistence on ACA — how SQLite survives redeploys

ACA consumption containers are ephemeral — the filesystem is wiped on redeploy, replica restart, or scale-to-zero wake. The SQLite *file* doesn't survive; the *data* does, via Litestream:

- Container entrypoint runs `litestream restore` against the Blob bucket before the app starts, pulling down the latest snapshot + WAL
- App opens SQLite normally; Litestream runs as a sidecar process streaming WAL frames to Blob continuously
- On the next start (redeploy, cold wake), restore happens again — fresh container, same data

Constraints this imposes:
- **Single writer only.** Pin `minReplicas=0, maxReplicas=1` on the Container App. SQLite + multi-replica = corruption.
- **Cold start adds a few seconds for restore.** Fine for personal use; if Plaid webhook latency ever matters, set `minReplicas=1` (still cheap on consumption).

Escape hatches if this gets gross:
- ACA volume mount to Azure Files (persistent, slower I/O, ~couple bucks/mo)
- Postgres Flexible Server Burstable B1ms (~$13/mo, no acrobatics)

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

### Spending money — single source of truth

The pain point in the old app was that the calc lived in a React hook. Every UI change risked changing the math.

Here, a `SpendingForecastService` in the app produces a `SpendingForecast` record:

```csharp
public record SpendingForecast(
    DateTimeOffset AsOf,
    string FormulaVersion,            // "v1"
    decimal CheckingBalance,
    DateOnly NextPaycheckDate,
    IReadOnlyList<BillDueBeforePaycheck> Bills,
    decimal TotalBillsBeforeNextPaycheck,
    decimal SpendingMoney);
```

- Formula lives in one place, in C#, easily unit-testable
- Versioned so a future v2 doesn't silently change semantics
- Pages/components consume the record — they never recompute

## Pages (v1)

1. **Home** — `SpendingForecast` card (balance, bills due before paycheck, money left, payday) + upcoming bills list + accounts list. That's the entire page.
2. **Bills** — list/edit/add bills, mark paid, see paid history, toggle auto-pay.
3. **Bank** — link a Plaid item, see linked institutions, unlink. Re-uses existing `/bank/setup` and `/bank/success/:itemId` flow shape.
4. **Settings** — pay schedule, pay days, lead days, theme.

That's it for v1. No charts, no breakdowns, no burndown.

## Features preserved from the current app

Carry over only what helps answer "what's due, what's paid, do I have enough":

- **Bills CRUD** — name, amount, frequency (monthly/biweekly/weekly/yearly), due-day rule (day-of-month / end-of-month / day-of-week), auto-pay flag, active flag
- **BillPayment occurrences** — generated forward from bills, marked paid manually or inferred from a Plaid transaction match
- **"Mark paid" action** with paid history visible per bill
- **Auto-pay vs manual** distinction surfaced in the upcoming bills list
- **Plaid linking flow** — link item, list institutions, unlink, transactions sync via webhook
- **Multi-account balance display** — checking, savings, credit; pulled from Plaid
- **Configurable pay schedule** — semimonthly / biweekly / weekly / monthly with `payDays[]` and `billLeadDays`
- **Light/dark theme toggle** — system default, user override
- **Responsive layout** — desktop sidebar, mobile bottom nav, mobile header

### Explicitly dropped

- Budget items / prorated category buckets
- Monthly cash/credit summaries page
- Spending category breakdown and trend charts
- Recent activity feed (bill added/due/paid/removed/updated accordions)
- Quests / gamification
- Hero "spending background chart"

## UI/UX vibe (carry forward)

The current app's look and feel is the one part that genuinely worked. Keep it:

- **Typography:** Nunito as the sans-serif body font. Tabular numerals for any monetary figure.
- **Color system:** semantic CSS custom-property tokens — `background`, `foreground`, `primary`, `secondary`, `accent`, `muted`, `card`, plus state colors `success`, `warning`, `destructive`, `info`. Both light and dark mode driven by a `.dark` class on the root.
- **Cards over chrome:** surfaces use a 1.5px border *or* a soft elevated shadow, not both. Rounded corners via a single `--radius` token.
- **Hero pattern:** the home page leads with a single high-contrast "answer" — the spending money number — sitting on a soft `from-primary/10 via-card to-accent/6` gradient with a couple of large blurred decorative blobs. Big, calm, immediately readable.
- **State coloring on the headline number:** green/primary when healthy, amber/warning when low, red/destructive when negative. The number tells you the answer at a glance before you read anything else.
- **Layout:** desktop sidebar nav, mobile bottom nav + sticky header. App shell is `h-screen flex` with a scroll container in the middle.
- **Density:** generous padding on mobile (`px-6 py-12`), tighter on desktop. Lists use card rows, not table rows.
- **Motion:** minimal — Radix-style accordion expand/collapse only. No page transitions.

In Blazor terms: one shared `MainLayout.razor` with the sidebar/bottom nav, a `Card.razor` component for the surface treatment, a `MoneyFigure.razor` for tabular-nums currency rendering with state coloring, and a `HeroBackdrop.razor` for the gradient + blobs treatment used by the home page.

## Cost model

Estimated monthly cost in Azure with current usage pattern (single user, low traffic):

| Service | Cost |
|---|---|
| Azure Container Apps (consumption, scale-to-zero) | ~$0–$2 |
| Azure Blob Storage (Litestream backup) | <$0.10 |
| Application Insights (free tier, 5GB/mo) | $0 |
| Plaid | $0 (current) |
| **Total** | **<$2/mo, fully covered by Azure credits** |

## Migration / cutover

- **Don't migrate data.** Personal finance — easier to re-link Plaid and import the last few months of transactions fresh than to write a migration tool.
- Keep `living.madebydade` running on `main` until rebuild is on parity.
- When ready: point the domain at the new app, archive the old branch.

## Open questions

- [ ] SQLite + Litestream vs. PostgreSQL Flexible Server (Burstable B1ms is ~$13/mo, not free but more familiar). Lean SQLite for v1, escape hatch to Postgres if I need it.
- [ ] Entra External ID vs. cookie auth on a single-user table. Entra is more learning, cookie is more pragmatic for a single user.
- [ ] Tailwind in a Blazor project — straightforward via the Tailwind CLI watching the project's content paths, but worth confirming the Aspire publish flow handles the CSS build step.
- [ ] Plaid webhook + ACA scale-to-zero: cold start could delay the webhook response. Acceptable for personal use, but worth measuring. Fallback: keep min replicas at 1 (cheap on consumption).
- [ ] Should `SpendingForecast` be a cached read model (rebuilt on bill/account change) or recomputed on each request? Recompute for v1; revisit if it's measurable.

## Out of scope for v1 (revisit later)

- Multi-user
- Mobile app
- Email/SMS reminders
- Budget items (the prorated "groceries, gas, etc." concept)
- Charts of any kind
- Credit card balance tracking beyond "this is the balance right now"
