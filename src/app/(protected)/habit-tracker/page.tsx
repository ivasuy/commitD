import type { Metadata } from "next";

import PageShell from "@/src/components/layout/PageShell";
import HabitTrackerDashboard from "@/src/components/habit-tracker/HabitTrackerDashboard";

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track weekly habits, mood, and motivation.",
};

export default function HabitTrackerPage() {
  return (
    <PageShell
      title="Habit Tracker"
      subtitle="Track weekly consistency, mood, and motivation."
    >
      <HabitTrackerDashboard />
    </PageShell>
  );
}
