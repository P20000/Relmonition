# Relmonition — Feature Roadmap & Specifications

This document outlines the granular feature set of the Relmonition platform, categorized by current implementation status.

---

## 🟢 1. Core Platform & Identity (Implemented)

The foundation for a secure, multi-tenant relationship platform.

### 1.1 Authentication & Profile
- **Email/Password Auth**: Secure sign-up and login utilizing `bcryptjs` for password hashing.
- **Session Management**: Opaque token-based session persistence with 7-day expiration.
- **User Profile Sync**: Real-time retrieval of account details (Email, Billing Status) in the Settings panel.
- **Dark Mode**: System-wide dark/light theme persistence (LocalStorage + CSS Variables).

### 1.2 Multi-Tenant Relationship Engine
- **Tenant Isolation**: Secure data partitioning using Turso (libSQL) row-level security.
- **Relationship Creation**: Owners can create a "Relationship Tenant" and name it.
- **Invitation System**: Generation of 6-character connection codes for partners to join.
- **Role Management**: Distinction between "Owner" (can delete/administer) and "Member" (can join/leave).
- **Tenant Switching**: Support for multiple relationships with seamless switching in the global context.

---

## 🟢 2. The Journaling Engine (Implemented)

A private space for personal reflection that powers shared growth.

### 2.1 Daily Reflective Prompts
- **Dynamic Prompts**: Rotation of clinically-grounded reflection questions based on the day of the year.
- **Progress Tracking**: Visual indicators for "Today's Status" (Completed vs. Pending).

### 2.2 Private Reflection Logic
- **Full Privacy Enforcement**: Journal history and daily entries are strictly restricted to the author's eyes.
- **Backend-Enforced Filtering**: Database-level filtering by `userId` to ensure raw content is never transmitted to the partner's device.
- **History View**: Searchable personal archive of all past reflections.

### 2.3 Semantic Foundation
- **AI Embedding on Write**: Every reflection is automatically processed by Google Gemini to create a high-dimensional vector representation.
- **AI Context Layer**: Reflections are stored in a shared context pool that the **AI Coach** can reference without revealing raw text to partners.

---

## 🟡 3. AI Insights & Coaching (In Progress)

The intelligence layer that turns reflections into relationship growth.

### 3.1 Relationship RAG (Retrieval-Augmented Generation)
- **Semantic Retrieval**: The ability to search through relationship history based on meaning, not just keywords.
- **Dual-Mode Processing**: 
    - *Retrieval*: Precise Q&A grounding for the AI Coach.
    - *Exploration*: Temporal pattern detection for weekly summaries and growth trends.

### 3.2 The AI Coach (Planned)
- **Context-Aware Chat**: A dedicated interface to ask questions about your relationship (e.g., "Why have we been feeling distant lately?").
- **Proactive Advice**: Automated triggers based on sentiment shifts detected in reflections.

---

## 🟡 4. The Dashboard & Analytics (Partially Implemented)

Visualizing the health and connection of the relationship.

### 4.1 Connection Metrics (Data Layer Implemented)
- **Gottman Connection Meter**: Tracking the 5:1 ratio of positive to negative interactions (Planned Visualization).
- **Weekly Pulse**: Sentiment trend analysis over a 7-day rolling window.

### 4.2 Mood Tracking (Coming Soon)
- **Quick Check-ins**: Granular 1-10 mood logging.
- **Emotional Trends**: Identifying recurring "low points" or "high points" in the week.

### 4.3 AI Insight Cards (UI Implemented)
- **Dashboard Digest**: Short, AI-generated summary cards highlighting growth areas or appreciative moments.

---

## 🔴 5. Premium & Compliance (Planned)

Scaling the platform for enterprise-grade security and sustainability.

### 5.1 HIPAA Hardening
- **WORM Audit Logging**: "Write Once, Read Many" logs to track every data access event for compliance.
- **BYOK (Bring Your Own Key)**: Allowing users to manage their own encryption keys via AWS KMS.
- **Deletion Orchestrator**: "Right to be Forgotten" cascading deletion that wipes all user data, including AI embeddings, across all shards.

### 5.2 Monetization
- **Stripe Integration**: Management of "Free" vs "Premium" account tiers.
- **Relationship Quotas**: Limits on relationship counts for free users.

---

## Technical Stack Overview
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express (Node.js), Drizzle ORM, Turso (SQLite/libSQL).
- **AI**: Google Generative AI (Gemini 1.5 Flash), Vector Embeddings.
- **Infrastructure**: AWS EKS (Planned), Vercel (Current Deployment), Terraform (IaC).
