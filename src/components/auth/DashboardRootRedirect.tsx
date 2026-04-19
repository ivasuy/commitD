"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/src/hooks/useAuth";

export default function DashboardRootRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signup");
      return;
    }
    router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a]">
      <div className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm text-white/70 backdrop-blur-sm">
        Keeping you CommitD...
      </div>
    </div>
  );
}
