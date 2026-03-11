# Magic Living — Design Vision

## Identity

**Magic Living** is a personal/family life dashboard. It starts with finance (bills, spending, bank accounts) but the architecture and design should support future expansion into other areas of family life. The Disney-inspired theming provides warmth and personality without being childish.

## Design Principles

1. **Warm, not corporate** — This is for your family, not a bank. Rounded corners, friendly font (Nunito), soft shadows, generous whitespace.
2. **Mobile-first** — Phone is the primary device. Every interaction must feel native on a small screen. Desktop is a bonus, not the target.
3. **Glanceable** — The home screen should answer "how are we doing?" in 2 seconds. Details are one tap away, never forced on you.
4. **No decoration for decoration's sake** — Every element earns its space. No SciFiBars, no shimmer, no mission banners, no XP/levels.
5. **Personality through theme, not chrome** — The 3 Disney themes (Magic Kingdom, Space Mountain, Haunted Mansion) provide all the personality needed. UI elements themselves stay clean and universal.

---

## App Shell

### Navigation — Sidebar (Desktop) + Bottom Tab Bar (Mobile)

**Desktop (≥768px):**

- Left sidebar, collapsible to icon-only
- Top: Logo + "Magic Living" text (hidden when collapsed)
- Middle: Nav items with icons + labels
  - 🏠 Home
  - 📋 Bills
  - 💰 Spending (currently "summaries")
  - 🏦 Bank
- Bottom: Theme switcher + User avatar/menu
- Width: 240px expanded, 64px collapsed
- Subtle border-right, card-colored background

**Mobile (<768px):**

- No sidebar
- Slim top header: Logo + page title + avatar
- Bottom tab bar (fixed): Home, Bills, Spending, Bank
- Active tab highlighted with primary color
- 56px height, safe-area-inset-bottom padding for notched phones

### Header (Mobile only)

- Height: ~48px
- Left: Small logo (24px) + page title
- Right: User avatar (tapping opens dropdown with theme switcher + sign out)

---

## Pages

### 🏠 Home (Dashboard)

**Purpose:** "How are we doing?" at a glance.

**Layout (mobile-first, single column):**

```
┌─────────────────────────┐
│ Spending Money           │
│                          │
│        $1,247.53         │
│                          │
│ Checking     $3,241.52   │
│ Bills due    -$1,993.99  │
│ Next paycheck  Mar 15    │
│                          │
│ Pace: ~$3,100 by EOM     │
│       (last month: $2,847)│
└─────────────────────────┘

┌─────────────────────────┐
│ Next 7 Days              │
│                          │
│ 📋 Netflix     -$15.99  Mar 15│
│ 📋 Electric   -$142.00  Mar 18│
│ 💰 Paycheck  +$2,250    Mar 15│
│                          │
│ Net: +$2,092.01          │
│                          │
│         View All →       │
└─────────────────────────┘

┌─────────────────────────┐
│ This Month          $2,847│
│ ├─ 🍔 Eating Out    $482 │
│ ├─ 🛒 Groceries    $410 │
│ ├─ 🛍️ Shopping     $283 │
│ └─ … 4 more              │
│                          │
│ ↑12% vs last month       │
│ Savings rate: 18%        │
└─────────────────────────┘

┌─────────────────────────┐
│ Accounts                 │
│                          │
│ 🏦 Checking    $3,241.52 │
│ 💳 Visa     $847.23 ↓3% │
│ 🐷 Savings   $12,500.00  │
└─────────────────────────┘

┌─────────────────────────┐
│ ⚡ Heads Up              │
│                          │
│ • $287 charge at Best Buy │
│   (larger than usual)     │
│ • CC balance down 3% from │
│   last month — nice!      │
└─────────────────────────┘

┌─ Recent Activity ────────┐
│ (collapsed by default)   │
└──────────────────────────┘
```

**How each insight fits:**

| Insight | Where it lives | How it shows |
|---------|---------------|--------------|
| Spending money | Hero card (top) | Big number + breakdown |
| Spending pace | Inside spending money card | Subtle line: "on track for ~$X by EOM" |
| Next 7 days forecast | "Next 7 Days" card | Combined bills + income timeline with net |
| Top categories | "This Month" card | Inline ranked list (top 3-4 categories) |
| Month-over-month | Inside "This Month" card | "↑12% vs last month" annotation |
| Savings rate | Inside "This Month" card | "Savings rate: 18%" line |
| CC debt trend | Inside "Accounts" card | Arrow + % next to CC balance |
| Unusual transactions | "Heads Up" card | Only shows when there's something notable — hidden when nothing unusual |

**Key design decisions:**

- Spending Money stays as the hero card — biggest, top of page
- "Next 7 Days" replaces the old "Upcoming Bills" — it's the same data but enriched with income so you see the net cash flow picture
- "This Month" is a compact spending summary with top categories inline — no need for a separate card per insight
- CC trend is just an annotation (↓3%) next to the balance in Accounts — doesn't need its own card
- "Heads Up" card is **conditional** — only appears when there's something worth flagging (unusual charges, notable trends). Most days it won't show, which is good.
- Activity stays at the bottom, collapsed — it's a log, not a decision-making tool

**Key changes from current:**

- Keep Spending Money front and center — this is the most important number ("what can I spend right now?"). Redesign the card to be cleaner but keep the `useSpendingMoney()` hook and its logic (checking balance minus unpaid bills due before next paycheck).
- Add a secondary "Spending This Month" card below it (total spending vs last month)
- Remove SciFiBars (decorative only)
- Upcoming bills: Show next 3-5 bills only, not the full toggle-able list
- Accounts: Simple list with balances, not the elaborate card layout
- Activity: Collapsed by default, expandable — it's a log, not primary content
- Remove inline nav links (sidebar/bottom nav handles navigation)
- Grid on desktop: 2 columns (spending money + upcoming bills left, monthly spending + accounts right)

**Data needed:**

- `useSpendingMoney()` hook (checking balance, unpaid bills, next paycheck date) — already exists
- Current + previous month `cashCreditSummaries` (for spending total, pace projection, month-over-month %)
- Savings contributions from summaries (for savings rate = savings / income)
- Upcoming unpaid bills (next 7 days, sorted by due date) + next paycheck date/amount from user settings
- Account balances from `plaidAccounts` (with previous month snapshot for CC trend — may need a new query)
- Transactions for current month grouped by `categoryPrimary` (top 3-4 for "This Month" card)
- Unusual transaction detection (new query: flag transactions > 2x the user's average for that merchant/category)

---

### 📋 Bills

**Purpose:** Manage recurring bills. Add, edit, delete, see what's due.

**Layout:**

```
┌─────────────────────────┐
│ Bills                [+] │
├─────────────────────────┤
│                          │
│ ┌─── Unpaid ──────────┐ │
│ │ Netflix    $15.99    │ │
│ │ Due Mar 15  · Auto   │ │
│ │            [Pay ✓]   │ │
│ ├──────────────────────┤ │
│ │ Electric   $142.00   │ │
│ │ Due Mar 18           │ │
│ │            [Pay ✓]   │ │
│ └──────────────────────┘ │
│                          │
│ ┌─── All Bills ───────┐ │
│ │ Mortgage  $1,850/mo  │ │
│ │ 1st · Auto · Fixed   │ │
│ │              [✏️] [🗑]│ │
│ ├──────────────────────┤ │
│ │ Netflix    $15.99/mo │ │
│ │ 15th · Auto · Fixed  │ │
│ │              [✏️] [🗑]│ │
│ └──────────────────────┘ │
└─────────────────────────┘
```

**Key changes from current:**

- Split into two sections: "Unpaid" (actionable, top) and "All Bills" (reference, below)
- Remove MissionBanner, SciFiBars
- Bills as stacked cards instead of a grid — better for mobile, easier to scan
- Add bill via [+] button in header (opens bottom sheet on mobile, dialog on desktop)
- Edit/delete inline per card
- Show auto-pay badge inline, not as a separate toggle
- Remove the separate "Back to Home" link (nav handles it)

---

### 💰 Spending (currently "summaries")

**Purpose:** "Where is my money going?"

_This will be fully redesigned with the spending dashboard. For now, just apply the new shell (sidebar/bottom nav) and clean up the existing page._

**Interim changes:**

- Remove SciFiBars, help accordion clutter
- Apply new card styling
- Period tabs: monthly + weekly only (drop daily)

**Full redesign (future session):**

- Add `categorySettings` table for user-managed essential/non-essential tagging
- Headline stats: Total Spending | Essential | Non-Essential | % change vs last month
- Category breakdown table grouped by classification
- Inline category toggle to reclassify
- Drill-down: click category → see transactions
- Month-over-month comparison

---

### 🏦 Bank

**Purpose:** Manage connected bank accounts.

**Layout:**

```
┌─────────────────────────┐
│ Connected Accounts       │
│                          │
│ ┌──────────────────────┐│
│ │ 🏦 Chase             ││
│ │ Checking ····4523    ││
│ │ Balance: $3,241.52   ││
│ ├──────────────────────┤│
│ │ 💳 Chase             ││
│ │ Visa     ····8901    ││
│ │ Balance: -$847.23    ││
│ └──────────────────────┘│
│                          │
│ [+ Link Another Account] │
└─────────────────────────┘
```

**Key changes:**

- Bank index is currently a placeholder — build it out as an accounts list
- Bank setup: Simpler card, remove SciFiBars
- Bank success: Cleaner confirmation, auto-redirect after a few seconds

---

## Component Changes

### Delete

- `SciFiBars.tsx` — decorative only, no function
- `MissionBanner.tsx` — gaming concept, doesn't fit

### Rename + Restyle

- `SciFiSheet.tsx` → `Sheet.tsx` — soften overlay, remove glow effects
- `SciFiDialog.tsx` → `Dialog.tsx` — soften overlay, remove glow effects
- `SciFiToast.tsx` → `Toast.tsx` — simpler styling, keep success/error/warning variants
- `SectionHeader.tsx` — remove gradient circle, just clean icon + text
- `CircularIcon.tsx` — remove radial gradient overlay

### New

- `Sidebar.tsx` — desktop sidebar navigation
- `BottomNav.tsx` — mobile bottom tab bar

### Restyle Only

- `StatTile.tsx` — softer shadows, rounded corners
- `Badge.tsx`, `PillBadge.tsx`, `NetPill.tsx` — minor tweaks
- `Button.tsx` / `buttonStyles.ts` — already migrated to semantic tokens
- All form components — already migrated

---

## Typography

**Font:** Nunito (Google Fonts)

- Weights: 400 (body), 600 (semibold labels), 700 (bold headings), 800 (extrabold hero numbers)
- Body: 16px / 1.5 line-height
- Headings: 18–24px, bold
- Numbers/money: Tabular nums, slightly larger than body text
- Small text (labels, captions): 12–14px, muted-foreground color

---

## Spacing & Cards

- Card border-radius: 12px (`rounded-xl`)
- Card padding: 16–24px
- Card shadow: `shadow-sm` (light themes), subtle border only (dark themes)
- Section gap: 16px (mobile), 24px (desktop)
- Page padding: 16px (mobile), 24–40px (desktop)
- Touch targets: minimum 44×44px

---

## Theme System (already built)

Three Disney-inspired themes, switchable from the sidebar/header:

- **Magic Kingdom** (light) — warm whites, royal blue + gold
- **Space Mountain** (dark) — deep navy, cool purple + teal
- **Haunted Mansion** (dark) — moody greens, dusty purple, aged gold

Theme infrastructure: CSS variables, `ThemeProvider` with `useTheme()` hook, `src/themes/` directory with typed definitions and a registry. All components already migrated to semantic color tokens.

---

## Implementation Plan

### Session 1: Shell

1. Add Nunito font
2. Build Sidebar + BottomNav
3. Integrate into AppLayout (replace current header-only nav)
4. Delete SciFiBars, MissionBanner
5. Rename SciFi\* → Sheet/Dialog/Toast
6. Clean up app.css (remove sci-fi animations)

### Session 2: Home + Bills

1. Redesign Home page (spending card, upcoming bills, accounts, activity)
2. Redesign Bills page (unpaid section + all bills cards)
3. Polish add/edit bill forms for new style

### Session 3: Bank + Spending Dashboard

1. Build out Bank index page (accounts list)
2. Clean up Bank setup/success pages
3. Build spending dashboard (categorySettings table, category breakdown, essential/non-essential, month-over-month)

### Session 4: Polish

1. Mobile polish pass (all pages)
2. Loading states, empty states, error states
3. Transitions and micro-interactions
4. Test all 3 themes across all pages
