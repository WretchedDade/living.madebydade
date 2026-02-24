# Linus — History

## Project Context

**App:** Living.MadeByDade — Personal finance tracker
**Owner:** Dade Cook
**Stack:** React, Vite, TypeScript, Convex, Clerk, Plaid, Tailwind CSS
**Purpose:** Track bills, due dates, and spending money to help make smarter financial choices

## Learnings

### Code Review — Critical Auth Gaps (2026-02-23)

**Finding:** Bills mutations/queries missing authentication. From Danny's architectural review.

**Issue:** `convex/bills.ts` functions (list, upsertBill, deleteBill, getBillById) have no `ctx.auth.getUserIdentity()` checks. Any authenticated user can access/modify any user's bills.

**Action:** 
1. Add userId field to bills table
2. Add auth guards to all bill operations
3. Enforce ownership checks on queries/mutations

**Severity:** CRITICAL — Data privacy breach risk.

### Code Review — Floating-Point Precision Errors (2026-02-23)

**Finding:** Money stored as `v.float64` and manipulated with standard float arithmetic. From Basher's quality review.

**Locations:** `convex/schema.ts`, `convex/cashCreditSummaries.ts`, `convex/bills.ts`

**Issue:** Rounding errors inevitable (0.1 + 0.2 ≠ 0.3). Erodes user trust.

**Action:**
- Short-term: Round to 2 decimals after every calculation
- Long-term: Migrate to integer storage (cents)

**Severity:** CRITICAL — Financial accuracy

### Code Review — Webhook Security (2026-02-23)

**Finding:** Plaid webhook missing signature verification. From both Danny and Basher.

**Location:** `convex/http.ts` endpoint `/plaid`

**Issue:** Accepts any POST without verifying Plaid signature. Attacker could trigger fake syncs, flood logs, corrupt data.

**Action:** Implement `plaid.verifyWebhookSignature()`.

**Severity:** CRITICAL — Security breach risk.

### Code Review — Schema Issues (2026-02-23)

**Issues:**
1. `convex/activitySchema.ts:22-23` uses `v.any()` for before/after fields (from Danny) — use proper union types
2. `convex/schema.ts:6` unused import `v as values` — remove
3. `convex/users.ts:10`, `convex/billPayments.ts:216` use `var` instead of `const` — modernize
4. `convex/transactions.ts:7` duplicate import of `internal` — remove
5. `convex/transactions.ts:12-65` duplicate `fetchNewTransactionSyncData` (also in plaidHelpers.ts) — remove unused copy

**Severity:** Important/Minor — code quality and maintainability.

### Implemented — Plaid Webhook Signature Verification (2026-02-23)

**Issue:** #2 — R1: Plaid Webhook Signature Verification
**PR:** #27 — `squad/2-plaid-webhook` → `squad-ini`

**What was done:**
- Added `jose` npm dependency for JWT verification (lightweight, Web Crypto API based)
- Added `verifyPlaidWebhook()` and `computeSha256Hex()` to `convex/plaidHelpers.ts`
- Updated `convex/http.ts` to gate webhook processing behind signature verification
- Missing or invalid `Plaid-Verification` header returns HTTP 400

**Verification flow:**
1. Decode JWT header → extract `kid`
2. Fetch key from Plaid via `webhookVerificationKeyGet({ key_id })`
3. Destructure only JWK-standard fields (`alg`, `crv`, `kid`, `kty`, `use`, `x`, `y`) to avoid passing Plaid-specific metadata to jose
4. Verify JWT signature + enforce 5-minute max token age via `jwtVerify`
5. Compare `request_body_sha256` claim against SHA-256 of actual body

**Key decisions:**
- Used `jose` library over manual Web Crypto — safer, handles algorithm confusion attacks
- Body read as text first (for hashing), then JSON.parse'd — can't read Request body twice
- Destructured JWK fields explicitly to maintain clean type boundaries between Plaid and jose types without `any` casts

**Key paths:** `convex/http.ts`, `convex/plaidHelpers.ts`
