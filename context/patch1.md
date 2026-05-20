Here is a production-ready, agent-optimized Markdown instruction file. You can paste this directly into your AI coding agent (Cursor, Copilot, Devin, etc.) or hand it to your engineering team.

```markdown
# 🛡️ TASK: P0 Security Remediation - Auth, Authorization & Multi-Tenant Isolation
**Platform:** Relmonition (Enterprise Relationship Wellness SaaS)  
**Stack:** Next.js (App Router) | Express/Node.js API | Turso (libSQL) | Docker | AWS EKS  
**Priority:** 🔴 CRITICAL (Blocks Production Deployment & Violates HIPAA/GDPR)

---

## 🎯 Objective
Implement a secure, multi-tenant authentication & authorization layer to eliminate Broken Object Level Authorization (BOLA/IDOR), enforce strict couple-siloed data isolation, and align all endpoints with HIPAA/GDPR compliance standards.

---

## 🔴 Critical Issues to Fix
1. **Missing Auth Middleware:** All Express routes are publicly accessible without session/token validation.
2. **Insecure Identity Resolution:** Controllers accept `userId`/`tenantId` from `req.body` or `req.params` for mutations.
3. **Unprotected Destructive Actions:** Tenant deletion & profile updates can be triggered by unauthenticated/forged requests.
4. **No Tenant Scoping:** Queries lack mandatory `tenant_id` filtering, risking cross-couple data leakage.
5. **No Audit Trail:** HIPAA requires immutable logging of auth events, data access, and mutations.

---

## 📐 Architectural Requirements
| Requirement | Implementation Spec |
|-------------|---------------------|
| **Session Auth** | JWT + Refresh Token flow. Access tokens stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies. 15m TTL. |
| **Tenant Isolation** | `tenant_members` join table. App-level enforcement of `WHERE tenant_id = ?` on every read/write (Turso lacks native RLS). |
| **Identity Resolution** | **NEVER** trust `req.body.userId` or `req.params.userId`. Always derive from verified `req.user`. |
| **Destructive Actions** | Soft-delete only (`deleted_at` timestamp). Background job handles 30-day GDPR purge. |
| **Audit Logging** | Middleware logs `user_id`, `tenant_id`, `action`, `resource`, `ip`, `user_agent`, `status_code` to `audit_logs`. |
| **Validation** | Zod schemas on all `req.body` payloads. Reject unknown keys. |

---

## 🛠️ Implementation Steps

### Step 1: Database Schema & Migrations
Create/run migration for:
```sql
CREATE TABLE tenant_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT CHECK(role IN ('owner', 'partner')),
  status TEXT DEFAULT 'active',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  tenant_id TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  ip TEXT,
  user_agent TEXT,
  status_code INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
```

### Step 2: Authentication Middleware (`middleware/auth.ts`)
- Extract `access_token` from `req.cookies`.
- Verify JWT signature & expiry.
- Validate session exists in `sessions` table (`status = 'active'`).
- Attach `{ userId, sessionId }` to `req.user`.
- Return `401` on failure.

### Step 3: Authorization Middleware (`middleware/authorize.ts`)
- Accept optional `requiredRole?: 'owner' | 'partner'`.
- Query `tenant_members` using `req.user.userId` and `req.params.tenantId` (or resolve from route context).
- Attach `req.tenantId` for downstream use.
- Return `403` if membership missing, inactive, or role mismatch.

### Step 4: Refactor All Route Controllers
- **Strip** any `userId`/`tenantId` extraction from `req.body`.
- **Replace** with `const { userId } = req.user;` and `const tenantId = req.tenantId;`.
- **Enforce** parameterized queries: `WHERE tenant_id = ? AND user_id = ?`.
- **Wrap** mutations with Zod validation.
- **Convert** `DELETE` routes to soft-delete with `deleted_at` timestamp.

### Step 5: Audit & Compliance Hooks
- Create `middleware/audit.ts` that logs all `POST/PATCH/DELETE` requests.
- Attach audit middleware globally to protected route groups.
- Prepare GDPR erase endpoint structure: `POST /api/v1/compliance/erase` → marks records for background purge.

---

## 🔑 Code Patterns to Enforce
```ts
// ✅ CORRECT: Identity from token
const { userId } = req.user;
const tenantId = req.tenantId;

// ✅ CORRECT: Tenant-scoped query
await db.all(
  `SELECT * FROM journal_entries WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
  [tenantId]
);

// ❌ BANNED: Client-supplied identity
const { userId } = req.body; // ← NEVER
const { tenantId } = req.params; // ← NEVER for writes without middleware validation
```

---

## 🛡️ Compliance & Security Constraints
- **HIPAA/GDPR:** All PII must be auditable. Journal text & AI prompts must be encrypted at rest (prepare AES-256-GCM column wrappers).
- **TLS 1.3:** Enforced at AWS ALB level. Backend assumes HTTPS.
- **Right to be Forgotten:** Implement `erase_status` state machine (`pending → purged`). Never block sync; use async worker.
- **Next.js Cookie Config:** `domain: process.env.COOKIE_DOMAIN || ".relmonition.com"`, `path: "/"`, `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`.
- **Turso/SQLite:** Use prepared statements exclusively. No string concatenation in queries.

---

## ✅ Validation & Testing Requirements
1. **Unit/Integration Tests:** 
   - Verify `401` on missing/expired JWT.
   - Verify `403` when accessing another tenant's data.
   - Verify profile updates fail when `userId` in body ≠ token identity.
2. **IDOR Simulation:** Use `supertest` to swap `tenantId`/`userId` in requests. Assert all leak attempts return `403` or `404`.
3. **Cookie Security:** Confirm cookies are `HttpOnly`, `Secure`, and not accessible via `document.cookie`.
4. **Soft-Delete Verification:** Confirm `DELETE` routes set `deleted_at` and exclude from reads.

---

## 📤 Expected Agent Deliverables
1. Complete `middleware/auth.ts`, `middleware/authorize.ts`, `middleware/audit.ts`.
2. Updated `tenant_members` & `audit_logs` migration scripts.
3. Refactored route controllers for:
   - Journal CRUD
   - Profile updates
   - Tenant leave/delete
   - AI chat logs retrieval
4. Zod validation schemas for all mutated payloads.
5. Next.js cookie configuration utility.
6. Brief security checklist confirming HIPAA/GDPR alignment points.

---

## ⚠️ Strict Guardrails
- **DO NOT** implement custom crypto. Use `jsonwebtoken` + `crypto` (Node.js native) or AWS KMS.
- **DO NOT** expose tokens in client-side JS or localStorage.
- **DO NOT** hard-delete relational data. Use soft deletes + purge queue.
- **DO NOT** bypass tenant scoping for "performance". Every query MUST be `tenant_id` filtered.
- **DO NOT** merge until all IDOR tests pass with `100%` coverage on protected routes.

---
**Proceed only after confirming stack compatibility. Output code in logical file chunks with clear import/export paths.**
```
