import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "CommitD — Central dashboard for weekly planner, habit tracker, task tracker, and finance tracker tools.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
