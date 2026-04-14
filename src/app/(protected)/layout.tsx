"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Navigation } from "../../components/Navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token) {
      router.push("/");
    }
  }, [token, router]);

  if (!token) return null;

  const activeView = pathname.includes('dashboard') ? 'dashboard' :
                     pathname.includes('journal') ? 'journal' :
                     pathname.includes('coach') ? 'coach' : 'dashboard';

  const handleNavigate = (view: 'dashboard' | 'journal' | 'coach') => {
    router.push(`/${view}`);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at top, var(--accent) 0%, var(--background) 50%)',
      }}
    >
      <Navigation activeView={activeView} onNavigate={handleNavigate} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">{children}</main>
    </div>
  );
}
