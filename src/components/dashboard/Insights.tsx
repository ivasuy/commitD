"use client";

import { GlassCard } from "@/src/components/ui/glass-card";
import MiniBarChart from "@/src/components/dashboard/charts/MiniBarChart";
import MiniDonut from "@/src/components/dashboard/charts/MiniDonut";
import IncomeExpenseBar from "@/src/components/dashboard/charts/IncomeExpenseBar";
import type {
  WeeklyPlannerSummary,
  HabitTrackerSummary,
  TaskTrackerSummary,
  FinanceTrackerSummary,
} from "@/src/lib/dashboard/types";

interface InsightsProps {
  weeklyPlanner: WeeklyPlannerSummary;
  habitTracker: HabitTrackerSummary;
  taskTracker: TaskTrackerSummary;
  financeTracker: FinanceTrackerSummary;
}

export default function Insights({
  weeklyPlanner,
  habitTracker,
  taskTracker,
  financeTracker,
}: InsightsProps) {
  return (
    <section className="relative z-10 space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-white/60">
        Tool Snapshots
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="min-h-[124px] p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-2">
            Weekly completion
          </p>
          {weeklyPlanner.hasData && weeklyPlanner.dayPercentages.some((p) => p > 0) ? (
            <MiniBarChart values={weeklyPlanner.dayPercentages} />
          ) : (
            <p className="text-sm text-white/50">No data</p>
          )}
        </GlassCard>

        <GlassCard className="min-h-[124px] p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-2">
            Habit daily %
          </p>
          {habitTracker.hasData && habitTracker.dailyPercentages.length > 0 ? (
            <MiniBarChart values={habitTracker.dailyPercentages} />
          ) : (
            <p className="text-sm text-white/50">No data</p>
          )}
        </GlassCard>

        <GlassCard className="min-h-[124px] p-3 flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-2">
            Tasks done
          </p>
          {taskTracker.hasData ? (
            <MiniDonut
              done={taskTracker.completed}
              total={taskTracker.totalTasks}
              size={56}
            />
          ) : (
            <p className="text-sm text-white/50">No data</p>
          )}
        </GlassCard>

        <GlassCard className="min-h-[124px] p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-2">
            Income vs expenses
          </p>
          {financeTracker.hasData ? (
            <IncomeExpenseBar
              income={financeTracker.actualIncome}
              expenses={financeTracker.actualExpenses}
            />
          ) : (
            <p className="text-sm text-white/50">No data</p>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
