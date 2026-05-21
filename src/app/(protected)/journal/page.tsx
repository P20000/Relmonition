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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please select a relationship in settings to access your journal.</p>
      </div>
    );
  }

  return <Journal userId={userId} tenantId={activeTenantId} />;
}
