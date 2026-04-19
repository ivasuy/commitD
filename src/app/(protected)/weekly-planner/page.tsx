import type { Metadata } from "next";

import PageShell from "@/src/components/layout/PageShell";
import WeeklyPlannerDashboard from "@/src/components/weekly-planner/WeeklyPlannerDashboard";

export const metadata: Metadata = {
  title: "Weekly Planner",
  description: "Mobile-first weekly planning dashboard with tasks, recurring tasks, notes, and analytics.",
};

export default function WeeklyPlannerPage() {
  return (
    <PageShell
      title="Weekly Planner"
      subtitle="Plan your week with daily tasks, progress analytics, recurring tasks, and notes."
    >
      <WeeklyPlannerDashboard />
    </PageShell>
  );
}
