import { Suspense } from "react";

import DashboardRootRedirect from "@/src/components/auth/DashboardRootRedirect";

function Fallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a]">
      <div className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm text-white/70 backdrop-blur-sm">
        Keeping you CommitD...
      </div>
    </div>
  );
}

export default function DashboardRootPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <DashboardRootRedirect />
    </Suspense>
  );
}
