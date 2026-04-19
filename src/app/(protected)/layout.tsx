import RequireAuth from "@/src/components/auth/RequireAuth";
import AppShell from "@/src/components/shell/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CommitD — Productivity Dashboard",
  description: "CommitD — be the master of your today and everyday. Weekly planner, habit tracker, task tracker, and finance tracker.",
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
