# Relmonition — Build Progress Tracker

---

## Phase 1: Foundation

| Status | Feature | Notes |
|--------|---------|-------|
| 🟡 | **Provision EKS with Fargate + namespace isolation** | `terraform/main.tf` provisions VPC and EKS with HIPAA audit logging. Uses `t3.medium` managed node groups — **Fargate profiles not yet switched to**. K8s namespace templates (`tenant-namespace.yaml`, `network-policy.yaml`) with resource quotas and NetworkPolicies are correctly implemented. |
| ✅ | **Turso row-level multi-tenant DB** | `TenantDatabaseManager` rewritten — now connects to your real Turso DB via `TURSO_CONNECTION_URL` / `TURSO_API_TOKEN`. Replaced broken per-tenant platform API provisioning with a shared `drizzle` client + `coupleId` row-level isolation. `getDatabaseClient()` is lazily initialized with proper env var loading. Auth and tenant controllers fully updated. **Added `/auth/me` profile sync and real user data (email, billing status) integration in Settings.** |
| 🟡 | **BYOK manager with AWS KMS integration** | IaC is solid: `terraform/kms.tf` provisions AES-256-GCM `eks_secrets` key with auto-rotation. Application-side multi-provider router (`byok-manager.ts`) **not yet built**. |
| 🔴 | **Deletion orchestrator with audit logging** | Not started. No cascading queue, `deleteTursoDatabase`, WORM audit log, or Pinecone index wipe logic exists yet. |

---

## Phase 2: AI Core

| Status | Feature | Notes |
|--------|---------|-------|
| 🟡 | **Dual-mode RAG pipeline (retrieval / exploration)** | `server/src/services/ai/retrieval-engine.ts` exists but performs temporal SQL lookups only — **no semantic vector index** (Pinecone / Qdrant) integration yet. **Fixed critical build errors and aligned RAG logic with `tenantId` multi-tenant schema.** |
| 🔴 | **Fine-tune embedding model** | Not started. |
| 🔴 | **Clinical guardrails** | Not started. |
| ✅ | **Next.js 15 App Router migration** | Frontend successfully migrated from Vite SPA to Next.js 15 App Router. Dev server running with Fast Refresh + static route indicators. INP/LCP streaming architecture now in place. |

---

## Phase 3: Compliance Hardening

| Status | Feature | Notes |
|--------|---------|-------|
| 🟡 | **HIPAA Security Rule technical controls** | EKS API/Audit logging enabled, TLS KMS secrets bound, strict Kubernetes NetworkPolicies in place. Not yet complete end-to-end. |
| 🔴 | **GDPR consent management + data portability** | Not started. |
| 🔴 | **SOC 2 Type I readiness & Pentesting** | Not started. |

---

## Legend
| Icon | Meaning |
|------|---------|
| ✅ | Completed |
| 🟡 | Partially completed / in progress |
| 🔴 | Not started |
