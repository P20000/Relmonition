# Relmonition — Build Progress Tracker

---

## Phase 1: Foundation

| Status | Feature | Notes |
|--------|---------|-------|
| 🟡 | **Provision EKS with Fargate + namespace isolation** | `terraform/main.tf` provisions VPC and EKS with HIPAA audit logging. Uses `t3.medium` managed node groups — **Fargate profiles not yet switched to**. K8s namespace templates (`tenant-namespace.yaml`, `network-policy.yaml`) with resource quotas and NetworkPolicies are correctly implemented. |
| ✅ | **Turso row-level multi-tenant DB** | `TenantDatabaseManager` rewritten — now connects to your real Turso DB via `TURSO_CONNECTION_URL` / `TURSO_API_TOKEN`. Replaced broken per-tenant platform API provisioning with a shared `drizzle` client + `coupleId` row-level isolation. `getDatabaseClient()` is lazily initialized with proper env var loading. Auth and tenant controllers fully updated. **Added `/auth/me` profile sync and real user data (email, billing status) integration in Settings.** |
| ✅ | **BYOK manager with AWS KMS integration** | Frontend `AIKeyManager` and backend `getLLMProvider` factory implemented. Supports encrypted per-tenant API keys (Gemini/OpenAI) stored in Turso with automatic fallback to system defaults. IaC provides AES-256-GCM `eks_secrets` key via KMS. |
| 🔴 | **Deletion orchestrator with audit logging** | Not started. No cascading queue, `deleteTursoDatabase`, WORM audit log, or Pinecone index wipe logic exists yet. |

---

## Phase 2: AI Core

| Status | Feature | Notes |
|--------|---------|-------|
| ✅ | **Dual-mode RAG pipeline (retrieval / exploration)** | Standardized multi-tenant RAG pipeline (`retrieval-engine.ts`) supporting `retrieval` (top-5 precision) and `exploration` (temporal trend analysis) modes. Uses in-process vector similarity ranking for high-performance context grounding. |
| ✅ | **AI Relationship Coach & Journaling Hub** | Centralized AI Coach interface with persistent chat threads, real-time response streaming, and interactive controls (Stop, Edit, Regenerate). Stabilized Journal system with accurate timezone/date pinning and reflection modals. Implemented Hybrid Greeting Strategy (90% templates / 10% LLM) for improved performance. |
| ✅ | **AI Smart Cataloging (Washjob)** | Gemini 1.5 Flash vision-powered clothing extraction pipeline. Automatically categorizes items and suggests metadata from images via the 'Auto-Fill' UI. |
| ✅ | **High-Performance Context & History** | Implemented batch-optimized RAG pipeline for large chat archives. Features real-time progress tracking (0-100%) and an automated background "Historian" engine that populates a multi-year relationship health timeline on the dashboard. |
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

