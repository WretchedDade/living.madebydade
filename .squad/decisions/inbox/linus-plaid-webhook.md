# Decision: Plaid Webhook Signature Verification Approach

**Author:** Linus (Backend Dev)
**Date:** 2026-02-23
**Issue:** #2 — R1: Plaid Webhook Signature Verification
**PR:** #27

## Context

The `/plaid` webhook endpoint was accepting any POST request without verifying it came from Plaid. This is a critical security vulnerability — an attacker could trigger fake transaction syncs, flood logs, or corrupt data.

## Decision

Used the `jose` npm library for JWT verification rather than implementing manual Web Crypto verification.

### Why jose?

- Handles JWS parsing, signature verification, and token age validation in a well-tested package
- Prevents algorithm confusion attacks out of the box
- Works in Convex's server runtime (uses Web Crypto API, no Node.js-specific dependencies)
- Widely adopted (1M+ weekly downloads), actively maintained

### Implementation Pattern

- Verification function (`verifyPlaidWebhook`) lives in `convex/plaidHelpers.ts` alongside other Plaid utilities
- JWK fields destructured explicitly when passing from Plaid's `JWKPublicKey` type to jose's `importJWK` — avoids type casting while keeping clean boundaries
- Request body read as text first (for SHA-256 hashing), then `JSON.parse`'d — since `Request.body` can only be consumed once

## Team Impact

- New `jose` dependency added to package.json
- Any future webhook endpoints should follow this same verification pattern
- If Plaid changes their verification flow, `verifyPlaidWebhook` is the single function to update
