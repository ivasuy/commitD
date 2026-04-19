"use client";

import { Suspense } from "react";
import { SignInLayout } from "./SignInLayout";
import { GlassCard } from "@/src/components/ui";
import AppBackground from "@/src/components/shell/AppBackground";

function SignInFallback() {
  return (
    <AppBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <GlassCard className="w-full max-w-md p-6">
          <div className="flex items-center justify-center py-12 text-sm text-white/70">
            Loading...
          </div>
        </GlassCard>
      </div>
    </AppBackground>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInLayout />
    </Suspense>
  );
}
