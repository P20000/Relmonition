# 🛡️ Relmonition

> **Production-grade, multi-tenant relationship intelligence platform.**  
> Not just an LLM wrapper — a high-compliance, privacy-first system built for secure, persistent, and deeply personal AI-driven insights.

Live at **[relmonition.dpdns.org](https://relmonition.dpdns.org)**

---

## What Is Relmonition?

Relmonition is a relationship intelligence platform that helps couples understand their relationship patterns through AI-powered journaling, mood tracking, and behavioral analytics. It uses a **Hierarchical RAG (Retrieval-Augmented Generation)** system that builds a growing, persistent memory from a couple's journal entries and chat history — enabling an AI coach that genuinely *knows* them over time.

Built for scale and privacy from day one. Every couple is an isolated tenant. Their data never touches another tenant's compute or database.

---

## Architecture Overview

Relmonition is built on a **Three-Pillar Security Model**:

| Pillar | Description |
|---|---|
| **Strict Isolation** | Namespace-per-tenant on AWS EKS + dedicated Turso DB per couple |
| **Persistent Memory** | Hierarchical RAG (Vector + Semantic) that grows with the relationship |
| **Immutable Auditing** | HIPAA/GDPR-aligned compliance labels on every namespace |

### Infrastructure & CI/CD Topology

<img width="1536" height="1024" alt="Infrastructure Diagram" src="https://github.com/user-attachments/assets/c89b4975-7992-450e-8d8b-8f1171f170a5" />

### Tenant Data Flow & Auth Lifecycle

<img width="1536" height="1024" alt="Data Flow Diagram" src="https://github.com/user-attachments/assets/72f1663f-924d-4b07-8a5b-56fd9a2c3185" />

### Request Data Flow

```mermaid
graph LR
    A[User / Browser] --> B{Next.js Frontend}
    B --> C[Express API — /api/v1]
    C --> D[Tenant Isolation Layer]
    D --> E{Context Switch}
    E --> F[(Dedicated Turso DB)]
    E --> G[(Global Turso DB)]
    F --> H[RAG Engine]
    G --> H
    H --> I[(Vector Embeddings)]
    H --> J[LLM Provider\nGemini / OpenAI]
    J --> K[Streaming Response]
    K --> B
```

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| **Next.js** | 16 (App Router) | SSR, routing, page shell |
| **React** | 19 | UI component framework |
| **Tailwind CSS** | v4 | Utility-first styling |
| **Radix UI** | Latest | Accessible headless components |
| **Motion** | 12 | Animations & transitions |
| **Recharts** | 2 | Relationship health graphs |
| **React Hook Form** | 7 | Form state management |
| **Sonner** | 2 | Toast notifications |
| **react-markdown** | 10 | Streaming AI response rendering |

### Backend

| Technology | Version | Role |
|---|---|---|
| **Node.js / Express** | Latest | REST API server |
| **TypeScript** | 6 | Type-safe service architecture |
| **Drizzle ORM** | Latest | Edge-compatible, type-safe SQL |
| **Turso (libSQL)** | Latest | Edge SQLite database (per-tenant) |

### AI & Intelligence

| Technology | Role |
|---|---|
| **Google Gemini** | Default LLM + embedding model |
| **OpenAI (compatible)** | BYO-key alternative provider |
| **Pluggable LLM Factory** | Per-tenant AI provider selection |
| **RAG Engine** | Semantic retrieval from vector embeddings |
| **Metrics Service** | Background behavioral analytics & sentiment scoring |

### Cloud & DevOps

| Technology | Role |
|---|---|
| **AWS EKS (K8s 1.30)** | Managed Kubernetes cluster |
| **AWS ECR** | Private container registry (KMS-encrypted) |
| **AWS KMS** | Envelope encryption for secrets at rest |
| **Terraform** | Full Infrastructure as Code |
| **Helm** | Per-tenant Kubernetes deployments |
| **GitHub Actions** | Zero-touch CI/CD pipeline |
| **NGINX Ingress** | Load balancing + TLS termination |
| **AWS ACM** | Automatic TLS certificate management |

---

## Project Structure

```
Relmonition/
├── src/                          # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx              # Landing / Login redirect
│   │   ├── layout.tsx            # Root layout
│   │   └── (protected)/          # Auth-gated routes
│   │       ├── dashboard/        # Main analytics dashboard
│   │       ├── coach/            # AI Coach chat interface
│   │       ├── journal/          # Journaling interface
│   │       ├── personality/      # Personality profiles & compatibility
│   │       └── settings/         # User & AI config settings
│   └── components/
│       ├── Dashboard.tsx         # Relationship metrics & health graphs
│       ├── AICoach.tsx           # Streaming AI chat with RAG
│       ├── Journal.tsx           # Daily journal with sentiment tagging
│       ├── Personality.tsx       # Trait profiles & compatibility scoring
│       ├── RelationshipManager.tsx # Couple connection & invite flow
│       ├── AIKeyManager.tsx      # BYO API key configuration
│       └── Navigation.tsx        # App navigation shell
│
├── server/                       # Express + TypeScript Backend
│   ├── src/
│   │   ├── index.ts              # Express app setup & route registration
│   │   ├── tenant-manager.ts     # TenantDatabaseManager (context switching)
│   │   ├── routes/
│   │   │   ├── auth-routes.ts    # Login, register, session
│   │   │   ├── tenant-routes.ts  # Tenant CRUD & invite codes
│   │   │   ├── rag-routes.ts     # RAG query & chat upload ingestion
│   │   │   ├── coach-routes.ts   # AI Coach conversations
│   │   │   ├── journal-routes.ts # Journal CRUD
│   │   │   ├── profile-routes.ts # Partner personality profiles
│   │   │   └── ai-config-routes.ts # Per-tenant LLM config
│   │   ├── services/ai/
│   │   │   ├── rag-service.ts    # Full RAG pipeline (retrieval + generation)
│   │   │   ├── embeddings-service.ts # Gemini text embedding
│   │   │   ├── retrieval-engine.ts   # Vector similarity search
│   │   │   ├── metrics-service.ts    # Behavioral analytics engine
│   │   │   ├── profile-service.ts    # AI-driven personality analysis
│   │   │   ├── greeting-service.ts   # Contextual daily greetings
│   │   │   └── providers/
│   │   │       ├── factory.ts        # Per-tenant LLM provider resolution
│   │   │       ├── gemini-provider.ts
│   │   │       └── openai-provider.ts
│   │   └── db/
│   │       └── schema.ts         # Full Drizzle ORM schema
│   └── Dockerfile                # Multi-stage production build
│
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # EKS cluster, VPC, NGINX Ingress
│   ├── ecr.tf                    # ECR repository + lifecycle policy
│   ├── kms.tf                    # KMS key for secret encryption
│   ├── backend.tf                # Remote state (S3)
│   ├── variables.tf
│   └── outputs.tf
│
├── charts/
│   └── relmonition-tenant/       # Helm chart — one release per couple
│       ├── Chart.yaml
│       ├── values.yaml           # Image, HPA, probes, ingress, secrets
│       └── templates/            # K8s Deployment, Service, Ingress, HPA
│
├── .github/workflows/
│   └── deploy-app.yml            # GitHub Actions CI/CD pipeline
│
└── deploy.sh                     # Helm upgrade entrypoint for CI
```

---

## Database Schema

All data is stored in **Turso (libSQL)** via **Drizzle ORM**. The schema is designed for both row-level isolation (shared global DB) and full DB-level isolation (dedicated per-tenant Turso instances).

```
Core Identity Layer
├── users             — Email/password auth, billing status
├── sessions          — Token-based session management
└── user_preferences  — Theme, notifications, data sharing

Multi-Tenant Layer
├── tenants           — Couple units (connection code, dedicated DB URL)
└── tenant_members    — User ↔ Tenant join table (owner / member)

Tenant Data
├── journal_entries   — Daily journal with sentiment score & category
├── mood_logs         — 1–10 mood tracking for graph trends
├── interaction_metrics — Gottman-inspired positive/negative interaction counts
├── ai_insights       — Cached AI output (conflict summaries, growth tips)
├── embeddings        — Gemini vector embeddings (journal + chat uploads)
├── chat_uploads      — Raw chat history files (WhatsApp, iMessage, etc.)
└── ai_provider_configs — Per-tenant BYO API key configuration

AI Coach
├── coach_conversations — Conversation sessions
└── coach_messages      — Individual messages (user / assistant)

Analytics
├── relationship_health_history — Weekly 0–100 health score timeline
└── (derived)            — Interaction metrics aggregated per day

Personality & Compatibility
├── partner_profiles       — Traits, likes, dislikes, communication style
└── compatibility_insights — AI-scored compatibility % + growth opportunities
```

---

## API Reference

All endpoints are prefixed `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Authenticate and create session |
| `GET/POST` | `/tenant` | Get or create a couple tenant |
| `POST` | `/tenant/join` | Join an existing tenant via invite code |
| `DELETE` | `/tenant/:id` | Right-to-be-Forgotten cascade delete |
| `POST` | `/rag/query` | Query the RAG engine with a question |
| `POST` | `/rag/stream` | Streaming RAG response |
| `POST` | `/rag/upload` | Upload & process a chat history file |
| `GET` | `/journal` | List journal entries for a tenant |
| `POST` | `/journal` | Create a new journal entry (auto-embeds) |
| `POST` | `/coach/conversations` | Start a new coach session |
| `POST` | `/coach/conversations/:id/messages` | Send a message (streaming) |
| `GET` | `/profiles/:tenantId` | Get partner personality profiles |
| `POST` | `/profiles/sync` | AI-sync profiles from journal history |
| `GET` | `/tenant/:id/ai-configs` | List AI provider configs |
| `POST` | `/tenant/:id/ai-configs` | Add a BYO API key |
| `GET` | `/dashboard/:tenantId` | Full dashboard analytics payload |
| `GET` | `/health` | Health check |

---

## CI/CD Pipeline

Every push to `main` (excluding `terraform/**` and `README.md`) triggers the full automated deployment:

```
Push to main
    │
    ▼
1. Configure AWS Credentials (IAM secrets from GitHub)
    │
    ▼
2. Login to Amazon ECR (private registry)
    │
    ▼
3. Docker build → tag with git SHA + 'latest' → push to ECR
    │
    ▼
4. Update kubeconfig (aws eks update-kubeconfig)
    │
    ▼
5. deploy.sh
    ├── Create namespace: couple-{id}
    │     └── Label: compliance-tier=hipaa-gdpr, encryption-required=true
    └── helm upgrade --install couple-{id} ./charts/relmonition-tenant
          ├── --set image.repository=<ECR_URL>
          ├── --set image.tag=latest
          ├── --set coupleId={id}
          ├── --set turso.connectionUrl=<secret>
          └── --set turso.authToken=<secret>
```

The Helm chart configures:
- **2 replicas** (min) with HPA scaling to 5 at 80% CPU
- **Liveness & readiness probes** on `/health`
- **NGINX Ingress** with ACM TLS certificate
- **Resource limits:** 512Mi RAM / 250m CPU per pod

---

## Infrastructure (Terraform)

Provisioned in `ap-south-1` (Mumbai):

```hcl
# VPC — 10.0.0.0/16, 2 AZs, private + public subnets, NAT Gateway
module "vpc" { ... }

# EKS Cluster — Kubernetes 1.30
# ├── HIPAA audit logging: api, audit, authenticator, controllerManager, scheduler
# ├── KMS secret encryption
# ├── IRSA (IAM Roles for Service Accounts)
# └── Managed Node Group: t3.medium SPOT, Bottlerocket AMI, 1–10 nodes
module "eks" { ... }

# ECR — KMS-encrypted, image scanning on push, 10-image lifecycle policy
resource "aws_ecr_repository" "server" { ... }

# NGINX Ingress Controller — deployed via Helm, manages AWS NLB
resource "helm_release" "ingress_nginx" { ... }

# KMS Key — used for EKS secret encryption + ECR image encryption
resource "aws_kms_key" "eks_secrets" { ... }
```

To provision from scratch:

```bash
cd terraform
terraform init
terraform apply
```

---

## Security & Compliance

| Layer | Strategy | Implementation |
|---|---|---|
| **Compute** | Namespace Isolation | K8s namespace per tenant with HIPAA/GDPR labels |
| **Database** | DB-level Isolation | Dedicated Turso instance per couple (optional) |
| **Encryption (transit)** | TLS 1.3 | AWS ACM + NGINX Ingress |
| **Encryption (rest)** | AES-256 | AWS KMS on EKS secrets + ECR images |
| **Container Security** | Hardened OS | Bottlerocket AMI on all EKS nodes |
| **Compliance** | Right to be Forgotten | Cascading delete across SQL, vectors, and uploads |
| **Audit Logging** | Immutable Logs | EKS control plane logs (api, audit, authenticator) |
| **Cost & Availability** | SPOT compute | t3.medium SPOT with HPA auto-scaling |

---

## Local Development

### Prerequisites

- Node.js ≥ 18, pnpm
- Turso CLI (`curl -sSfL https://get.tur.so/install.sh | bash`)
- A Turso database + auth token

### Frontend

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL, etc.

# Start dev server
pnpm dev
```

### Backend

```bash
cd server
npm install

# Set up environment
cp .env.example .env
# Fill in TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN, GEMINI_API_KEY

# Run database migrations
npm run db:migrate

# Start the API server
npm run dev
# Runs on http://localhost:3001
```

---

## Deployment (Manual)

For deploying a new tenant manually (requires `kubectl` + `helm` access to the cluster):

```bash
# Update kubeconfig
aws eks update-kubeconfig --name relmonition-cluster --region ap-south-1

# Deploy a new tenant namespace
./deploy.sh <TENANT_ID>

# Verify deployment
kubectl get pods -n couple-<TENANT_ID>
kubectl logs -n couple-<TENANT_ID> -l app=relmonition-server --tail=30
```

---

## Roadmap

- [x] Hierarchical RAG with Gemini embeddings
- [x] Behavioral analytics engine (sentiment, Gottman metrics)
- [x] Namespace-per-tenant isolation on EKS
- [x] BYO API key (Gemini / OpenAI)
- [x] Chat history ingestion (bulk embedding pipeline)
- [x] Personality profiling & AI compatibility scoring
- [x] Streaming AI coach with conversation history
- [ ] BYOK (Bring Your Own KMS Key) for enterprise tenants
- [ ] SOC 2 Type II compliance certification
- [ ] Fine-tuned local models for on-device sensitive inference
- [ ] Dedicated Turso DB provisioning per tenant on signup

---

### Built by

**Pranav Dwivedi** — [LinkedIn](https://www.linkedin.com/in/pranav-dwivedi-535658219/)

> *Relmonition is not just an app — it is the secure infrastructure for the future of relationship intelligence.*
