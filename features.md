# Relmonition — Feature Roadmap & Specifications

This document outlines the granular feature set of the Relmonition platform, categorized by implementation status.

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
- **Auto-Selection**: Intelligent onboarding that automatically selects the first available relationship upon login or refresh.
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
- **Calendar View**: Interactive calendar to navigate and view past reflections by date.

### 2.2 Private Reflection Logic
- **Full Privacy Enforcement**: Journal history and daily entries are strictly restricted to the author's eyes.
- **Backend-Enforced Filtering**: Database-level filtering by `userId` to ensure raw content is never transmitted to the partner's device.
- **History View**: Searchable personal archive of all past reflections.

### 2.3 Semantic Foundation & Smart Sync
- **AI Embedding on Write**: Every reflection is automatically processed by Google Gemini to create a high-dimensional vector representation.
- **Smart Sync Trigger**: Background logic that automatically triggers AI profile regeneration every 3-4 journal entries to keep insights fresh.
- **AI Context Layer**: Reflections are stored in a shared context pool that the **AI Coach** can reference without revealing raw text to partners.

---

## 🟢 3. AI Insights & Coaching (Implemented)

The intelligence layer that turns reflections into relationship growth.

### 3.1 Relationship RAG (Retrieval-Augmented Generation)
- **Semantic Retrieval**: The ability to search through relationship history based on meaning, not just keywords.
- **Dual-Mode Processing**: 
    - *Retrieval*: Precise Q&A grounding for the AI Coach.
    - *Exploration*: Temporal pattern detection for weekly summaries and growth trends.

### 3.2 The AI Coach
- **Context-Aware Chat**: A dedicated interface to ask questions about your relationship (e.g., "Why have we been feeling distant lately?").
- **Chat Management**: Ability to delete conversations and clear chat history securely.
- **Glass-morphism UI**: Modern, interactive sidebar with real-time feedback and session persistence.

---

## 🟢 4. Dashboard & Analytics (Implemented)

Visualizing the health and connection of the relationship.

### 4.1 Connection Metrics
- **Gottman Ratio**: Real-time tracking of the 5:1 ratio of positive to negative interactions.
- **Connection Health Score**: A percentage-based metric reflecting the overall vitality of the bond.
- **Interaction Trends**: Weekly sentiment trend analysis visualizing the "Pulse" of the relationship.

### 4.2 Actionable Insight Cards
- **Best Moments**: AI-curated highlights of the relationship's highest points with deep insights into why they matter.
- **Improvements Required**: Intelligent detection of negative patterns with actionable AI-generated fixes to strengthen the bond.

---

## 🟢 5. Personality & Compatibility (Implemented)

Deep synthesis of who you are as individuals and as a couple.

### 5.1 Partner Profiles
- **Personality Synthesis**: AI-driven extraction of core traits and communication styles.
- **Likes & Dislikes**: Interactive tags for tracking partner preferences with manual editing support.
- **Triggers & Traumas**: Sensitive, AI-identified patterns to help partners navigate difficult moments with empathy.

### 5.2 Compatibility Analysis
- **Dynamic Percentage Match**: A living score that adjusts as you interact and journal.
- **Growth Opportunities**: Specific, named-based AI summaries highlighting exactly how the couple can evolve together.

---

## 🔴 6. Premium & Compliance (Planned)

Scaling the platform for enterprise-grade security and sustainability.

### 6.1 HIPAA Hardening
- **WORM Audit Logging**: "Write Once, Read Many" logs to track every data access event for compliance.
- **BYOK (Bring Your Own Key)**: Allowing users to manage their own encryption keys via AWS KMS.
- **Deletion Orchestrator**: "Right to be Forgotten" cascading deletion that wipes all user data across all shards.

### 6.2 Monetization
- **Stripe Integration**: Management of "Free" vs "Premium" account tiers.

---

## Technical Stack Overview
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express (Node.js), Drizzle ORM, Turso (SQLite/libSQL).
- **AI**: Google Generative AI (Gemini 2.0 Flash), Vector Embeddings.
- **Infrastructure**: Vercel (Current Deployment), Docker, Terraform (IaC).
