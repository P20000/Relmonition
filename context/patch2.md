# Relmonition Security Patches & Pipeline (Patch 2)

This patch documents the security mitigations, expanded controller test suites, and automated security checking pipelines implemented for the Relmonition backend.

---

## 1. Security Vulnerability Patches

### SEC-01 & SEC-02: Tenant Creation & Join Spoofing Fix
- **Location:** `server/src/controllers/tenant-controller.ts`
- **Mitigation:** Removed client-supplied `userId` parameter from the request body payloads inside `createTenant` and `joinTenant`. Resolved user identity directly from the authenticated JWT session (`req.user.userId`). This prevents database insertion crashes due to Zod key stripping and halts malicious `userId` spoofing.

### SEC-03: AI Coach IDOR / BOLA Prevention
- **Location:** `server/src/controllers/coach-controller.ts`
- **Mitigation:** Implemented a secure database-backed helper `validateSession` that queries ownership context of conversations. Implemented validation guards inside `getMessages`, `streamChat`, `deleteConversation`, `regenerateResponse`, and `editLatestPrompt` to deny access and return `403 Forbidden` if a session does not belong to the authenticated user and tenant.

### SEC-04: AI Prompt Injection Guardrails
- **Location:** `server/src/services/ai/rag-service.ts`
- **Mitigation:** Rewrote LLM prompt templates to isolate user queries using XML tags (`<couple_memories>`, `<user_query>`). Updated the system instructions to explicitly direct the AI to ignore any overrides, role changes, or instructions requesting raw memory outputs found inside the `<user_query>` block.

### SEC-05: Opaque Token Verification Hardening
- **Location:** `server/src/middleware/auth.ts`
- **Mitigation:** Replaced generic `.length === 64` checks with a strict 64-character hexadecimal regular expression test: `/^[0-9a-f]{64}$/.test(token)`. This halts arbitrary 64-character plain text or SQL injections from reaching database queries.

### SEC-06: API Rate Limiter (Denial of Wallet Defense)
- **Locations:**
  - `server/src/middleware/rate-limiter.ts` (New Middleware)
  - `server/src/routes/coach-routes.ts`
  - `server/src/routes/rag-routes.ts`
- **Mitigation:** Implemented a lightweight, zero-dependency, in-memory rate-limiter. Applied throttling to RAG query operations (20 requests per 15 minutes) and AI Coach streams/modifications, protecting AI resources from abuse.

### SEC-07: Cross-Origin Credentials Transmission (Rookie Frontend Bug Fix)
- **Locations:**
  - `src/components/Dashboard.tsx`
  - `src/components/AICoach.tsx`
- **Mitigation:** Added `{ credentials: 'include' }` to raw `fetch` requests. Previously, these queries omitted credentials, preventing HttpOnly session cookies from being transmitted cross-origin in local development (port 3000 to 3001) and production subdomains, causing backend authentication to return `401 Unauthorized` requests.

---

## 2. Expanded Testing & Security Checks

### Security Test Suites
Expanded Vitest unit tests under `server/src` to ensure all security patches are fully tested:
- **Rate-Limiter Tests:** `server/src/middleware/__tests__/rate-limiter.test.ts` (Verifies throttling, blocking, and window resets. Fixed a TypeScript compiler error where the read-only `ip` property of the `Request` object was being directly assigned to instead of using type casting).
- **AI Coach Tests:** `server/src/controllers/__tests__/coach-controller.test.ts` (Verifies BOLA/IDOR protection guards return `403` for spoofed conversation requests).
- **Tenant Onboarding Tests:** `server/src/controllers/__tests__/tenant-controller.test.ts` (Verifies spoofed user IDs in payloads are discarded in favor of authenticated tokens).

All **44/44** test suites run and pass successfully.

### Automated Security check Pipeline
- **Location:** `server/scripts/security-check.ts`
- **Pipeline Stages:**
  1. **Dependency Audit:** Checks third-party npm package vulnerabilities via `npm audit`.
  2. **Route Protection Scan (SAST):** Scans route definitions and raises warnings if endpoints lack authentication middleware.
  3. **SQL Injection Scan (SAST):** Checks for raw SQL literal interpolations that could bypass parameterized bindings.
  4. **Prompt Safety Check (SAST):** Checks that LLM query builders use XML tags for input shielding.
  5. **Test Runner:** Executes the backend test suite.
- **NPM Integration:** Configured `"security-check": "ts-node scripts/security-check.ts"` script inside `server/package.json` to easily execute the full pipeline locally.

### Express Middleware Ordering & Defensive Logging
- **Middleware Order Fix:** In `server/src/index.ts`, moved `express.json()` before the `auditLogger` middleware. Previously, because `auditLogger` executed first, `req.body` was undefined on mutations, causing a TypeError crash when reading `req.body.tenantId`.
- **Defensive Audit Logger:** Added optional chaining (`req.body?.tenantId`, `req.params?.tenantId`, etc.) in `server/src/middleware/audit.ts` to prevent runtime crashes.
- **Client Auth Log Suppression:** Added checks in `src/context/AuthContext.tsx` to suppress `Authentication required` (401) error logs in the console during the initial session sync, keeping development console logs clean.

### Database Sanitation & Empty-State Verification
- **Turso Database Reset:** Executed the `server/scripts/wipe.ts` utility to drop all tables, purging all mock/seeded users, preferences, journal entries, mood logs, and relationship insights.
- **Clean Schema Re-initialization:** Re-initialized all tables in their clean, empty state by running `npx drizzle-kit push` against the Turso database URL, verifying the schema structure with zero entries.
- **Verification Utility:** Updated the `test-db.ts` verification script with fallback parameters to ensure connectivity works with Turso environment configuration values.

### Navigation Tab Transition Animation
- **Fluid Wipe-Out / Wipe-In Transition:** Integrated `motion` and `AnimatePresence` from `framer-motion` in `src/components/Navigation.tsx`. To prevent scroll-coordinate offset calculation bugs (where Next.js route scroll resets causes the global `layoutId` indicator to animate from the bottom/top of the screen), the tab indicator uses a local transition. When tabs change, the background of the active tab shrinks, horizontal-scales (`scaleX`), and blurs out (wipes out), while the new tab smoothly expands, scales, and focuses in (wipes in).
