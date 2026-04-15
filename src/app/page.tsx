"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { AuthPage } from "../components/AuthPage";

export default function Home() {
  const { token, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  
  if (token) return null; 

  return <AuthPage />;
}
