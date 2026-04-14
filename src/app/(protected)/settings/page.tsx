"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Settings } from "../../../components/Settings";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { userId, logout } = useAuth();
  const router = useRouter();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("activeTenantId") : null
  );

  const handleTenantChange = (tenantId: string | null) => {
    setActiveTenantId(tenantId);
    if (tenantId) {
      localStorage.setItem("activeTenantId", tenantId);
    } else {
      localStorage.removeItem("activeTenantId");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <Settings
      userEmail="user@relmonition.com"
      userId={userId || "demo-user"}
      activeTenantId={activeTenantId}
      onTenantChange={handleTenantChange}
      onLogout={handleLogout}
    />
  );
}
