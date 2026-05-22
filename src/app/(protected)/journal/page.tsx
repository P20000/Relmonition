"use client";
import { Journal } from "../../../components/Journal";
import { useAuth } from "../../../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function JournalPage() {
  const { userId, activeTenantId, isLoaded } = useAuth();

  // Wait for auth state to hydrate from localStorage before evaluating
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userId || !activeTenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-sm">
          <div
            className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-3xl"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-primary opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">No Relationship Selected</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Your journal is tied to a relationship space. Head to Settings to create one or join an existing space with your partner.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return <Journal userId={userId} tenantId={activeTenantId} />;
}
