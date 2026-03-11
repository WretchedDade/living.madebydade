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
│ Spending This Month      │
│ $2,847 of ~$4,500       │
│ ████████████░░░░  63%    │
│ ↑12% vs last month       │
└─────────────────────────┘

┌─────────────────────────┐
│ Upcoming Bills (3)       │
│                          │
│ Netflix     $15.99  Mar 15│
│ Electric    $142.00 Mar 18│
│ Mortgage  $1,850.00 Mar 25│
│                          │
│         View All →       │
└─────────────────────────┘

┌─────────────────────────┐
│ Accounts                 │
│                          │
│ 🏦 Checking    $3,241.52 │
│ 💳 Visa        -$847.23  │
│ 🐷 Savings   $12,500.00  │
└─────────────────────────┘

┌─────────────────────────┐
│ Recent Activity          │
│                          │
│ • Paid Electric — $142   │
│ • Added new bill — Gym   │
│ • (collapsed by default) │
└─────────────────────────┘
```

**Key changes from current:**

- Replace SpendingMoneyCard with simpler "Spending This Month" card (total spending vs income, progress bar, vs last month %)
- Remove SciFiBars (decorative only)
- Upcoming bills: Show next 3-5 bills only, not the full toggle-able list
- Accounts: Simple list with balances, not the elaborate card layout
- Activity: Collapsed by default, expandable — it's a log, not primary content
- Remove inline nav links (sidebar/bottom nav handles navigation)
- Grid on desktop: 2 columns (spending + bills left, accounts + activity right)

**Data needed:**

- Current month `cashCreditSummaries` (`cashSpending + ccPurchases` = total spending)
- Previous month for comparison
- Upcoming unpaid bills (next 5, sorted by due date)
- Account balances from `plaidAccounts`
- Recent activity (last 5 items)

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
