# Feature 4: Deletion Orchestrator & WORM Audit Logging

## Overview
We successfully implemented the **"Right to be Forgotten"** account deletion mechanism, bringing the Relmonition platform into compliance with data privacy regulations (HIPAA/GDPR). This feature handles the complex, multi-layered destruction of user identities and their isolated relational data across the system.

## Key Backend Implementations

### 1. The Deletion Orchestrator (`deletion-orchestrator.ts`)
We engineered a dedicated service layer that safely orchestrates database wipes using a hybrid "Soft-Tenant vs Full-Tenant" approach:
- **Soft-Tenant Wipe**: If a user is part of a couple (the tenant has 2 members), the orchestrator surgically deletes *only* the departing user's specific Journal Entries, Chat Uploads, and AI Coach Conversations. The shared tenant structure and the partner's data remain completely intact.
- **Full-Tenant Wipe**: If the departing user is the *only* member of the tenant, the orchestrator triggers the `executeRightToBeForgotten` protocol. This executes a cascading delete across the entire tenant structure, permanently destroying the `tenants` record, all associated embeddings, mood logs, and metrics.

### 2. Core Identity Scrubbing
Following the tenant resolution phase, the orchestrator permanently scrubs the user from the global identity layer by deleting their `sessions`, `userPreferences`, and `users` table records.

### 3. Immutable WORM Audit Logging
To satisfy compliance auditors, every deletion event generates a permanent, Write-Once-Read-Many (WORM) receipt in the `auditLogs` table. This record logs the `userId`, exact timestamp, and the action (`ACCOUNT_DELETION`), proving that the personal data was legally destroyed.

## Frontend Enhancements

### Interactive Deletion Modal (`Settings.tsx`)
We replaced standard browser prompts with a premium, custom-built React modal.
- **Safety First**: The modal requires the user to type the word `DELETE` into an input field before the destructive action is unlocked.
- **Animated Simulation**: Upon confirmation, the modal locks the UI and displays a progress bar that simulates the backend orchestration sequence, giving the user psychological reassurance that their data is actively being scrubbed:
  1. *Initializing deletion sequence...*
  2. *Scrubbing journal entries...*
  3. *Wiping vector embeddings...*
  4. *Removing tenant identity...*
  5. *Writing WORM audit log...*
  6. *Account destroyed.*
- **Clean Exit**: Once the wipe is verified, the frontend automatically purges local auth state and redirects the user to the login screen.
