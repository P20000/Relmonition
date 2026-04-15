"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Settings } from "../../../components/Settings";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { userId, email, accountType, activeTenantId, setActiveTenantId, logout } = useAuth();
  const router = useRouter();

  const handleTenantChange = (tenantId: string | null) => {
    setActiveTenantId(tenantId);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!userId) {
    return null; // Or a loader
  }

  return (
    <Settings
      userEmail={email || ""}
      userId={userId}
      accountType={accountType}
      activeTenantId={activeTenantId}
      onTenantChange={handleTenantChange}
      onLogout={handleLogout}
    />
  );
}
