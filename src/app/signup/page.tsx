"use client";

import { Suspense } from "react";
import { SignUpLayout } from "./SignUpLayout";
import { GlassCard } from "@/src/components/ui";
import AppBackground from "@/src/components/shell/AppBackground";

function SignUpFallback() {
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpLayout />
    </Suspense>
  );
}
