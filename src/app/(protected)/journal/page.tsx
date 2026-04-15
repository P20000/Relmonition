"use client";
import { Journal } from "../../../components/Journal";
import { useAuth } from "../../../context/AuthContext";

export default function JournalPage() {
  const { userId, activeTenantId } = useAuth();

  if (!userId || !activeTenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please select a relationship in settings to access your journal.</p>
      </div>
    );
  }

  return <Journal userId={userId} tenantId={activeTenantId} />;
}
