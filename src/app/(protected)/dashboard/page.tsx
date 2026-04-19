"use client";

import { useEffect, useState } from "react";
import {
  getWeeklyPlannerSummary,
  getHabitTrackerSummary,
  getTaskTrackerSummary,
  getFinanceTrackerSummary,
} from "@/src/lib/dashboard/aggregate";
import type { DashboardSummaries } from "@/src/lib/dashboard/types";
import PageShell from "@/src/components/layout/PageShell";
import { GlassButton } from "@/src/components/ui";
import StatTile from "@/src/components/dashboard/StatTile";
import Insights from "@/src/components/dashboard/Insights";
import OverallProgressWidget from "@/src/components/dashboard/OverallProgressWidget";
import HabitTrackerInsightsWidget from "@/src/components/dashboard/HabitTrackerInsightsWidget";
import TaskAnalyticsSection from "@/src/components/dashboard/TaskAnalyticsSection";
import { useAuth } from "@/src/hooks/useAuth";
import {
  CalendarDays,
  BarChart3,
  ListChecks,
  PiggyBank,
} from "lucide-react";

const EMPTY_SUMMARIES: DashboardSummaries = {
  weeklyPlanner: {
    hasData: false,
    completionPercent: 0,
    completedTasks: 0,
    totalTasks: 0,
    dayPercentages: [0, 0, 0, 0, 0, 0, 0],
    weekStart: "",
  },
  habitTracker: {
    hasData: false,
    completionPercent: 0,
    completedChecks: 0,
    totalPossibleChecks: 0,
    habitsCount: 0,
    dailyPercentages: [],
    monthKey: "",
  },
  taskTracker: {
    hasData: false,
    totalTasks: 0,
    overdue: 0,
    completed: 0,
    notCompleted: 0,
    todayCount: 0,
    donePercent: 0,
  },
  financeTracker: {
    hasData: false,
    monthBalance: 0,
    totalBalance: 0,
    actualIncome: 0,
    actualExpenses: 0,
    monthKey: "",
  },
};

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<DashboardSummaries>(EMPTY_SUMMARIES);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const load = async () => {
      const [weeklyPlanner, habitTracker, taskTracker, financeTracker] = await Promise.all([
        getWeeklyPlannerSummary(user.uid),
        getHabitTrackerSummary(user.uid),
        getTaskTrackerSummary(user.uid),
        getFinanceTrackerSummary(user.uid),
      ]);

      if (!active) {
        return;
      }

      setSummaries({
        weeklyPlanner,
        habitTracker,
        taskTracker,
        financeTracker,
      });
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  const wp = summaries.weeklyPlanner;
  const ht = summaries.habitTracker;
  const tt = summaries.taskTracker;
  const ft = summaries.financeTracker;

  return (
    <PageShell
      brandLabel="CommitD"
      upgradeButtonMode="icon"
      title="Dashboard"
      subtitle={
        user?.email
          ? `Signed in as ${user.email}`
          : "Your productivity overview for the week."
      }
      rightAction={
        <GlassButton variant="glass-outline" type="button" onClick={() => signOut()}>
          Log out
        </GlassButton>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          title="Weekly Planner"
          value={wp.hasData ? `${wp.completionPercent}%` : "—"}
          subtitle={
            wp.hasData
              ? `${wp.completedTasks} / ${wp.totalTasks} tasks`
              : "No data yet"
          }
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatTile
          title="Habit Tracker"
          value={ht.hasData ? `${ht.completionPercent}%` : "—"}
          subtitle={
            ht.hasData
              ? `${ht.completedChecks} / ${ht.totalPossibleChecks} checks`
              : "No data yet"
          }
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatTile
          title="Task Tracker"
          value={tt.totalTasks}
          subtitle={
            tt.hasData ? `${tt.overdue} overdue` : "No data yet"
          }
          icon={<ListChecks className="h-5 w-5" />}
        />
        <StatTile
          title="Finance Tracker"
          value={ft.hasData ? formatMoney(ft.monthBalance) : "—"}
          subtitle={
            ft.hasData
              ? `Total: ${formatMoney(ft.totalBalance)}`
              : "No data yet"
          }
          icon={<PiggyBank className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <OverallProgressWidget uid={user?.uid ?? null} />
        </div>

        <div className="xl:col-span-4">
          <TaskAnalyticsSection uid={user?.uid ?? null} />
        </div>

        <div className="xl:col-span-12">
          <HabitTrackerInsightsWidget uid={user?.uid ?? null} />
        </div>
      </section>

      <Insights
        weeklyPlanner={wp}
        habitTracker={ht}
        taskTracker={tt}
        financeTracker={ft}
      />
    </PageShell>
  );
}
