/**
 * Dashboard aggregation: read-only access to Firestore data.
 * Uses local time for "current week" and "current month".
 * Safe when data is empty or missing.
 */

import { getDaysInMonth } from "@/src/lib/date";
import { loadHabitMonth } from "@/src/lib/db/store";
import { calculateMonthMetrics } from "@/src/lib/habit-tracker/metrics";
import { getTaskCounters } from "@/src/lib/task-tracker/metrics";
import {
  getLocalNow,
  toLocalYMD,
  toLocalYM,
  addDaysLocal,
} from "@/src/lib/time/localTime";
import { loadWeeklyPlanner, loadTaskTracker, loadFinanceMonth, loadFinanceMonthIfExists, loadFinanceSettings } from "@/src/lib/db/store";
import { calculateWeeklyMetrics } from "@/src/lib/weekly-planner/metrics";
import { buildOverviewMetrics } from "@/src/lib/finance-tracker/metrics";
import { getPreviousMonthKey } from "@/src/lib/finance-tracker/date";
import type {
  WeeklyPlannerSummary,
  HabitTrackerSummary,
  TaskTrackerSummary,
  FinanceTrackerSummary,
} from "@/src/lib/dashboard/types";

/** Current week start (Sunday) in YYYY-MM-DD */
function getThisWeekStart(): string {
  const now = getLocalNow();
  const todayYmd = toLocalYMD(now);
  const dayOfWeek = now.getDay();
  return addDaysLocal(todayYmd, -dayOfWeek);
}

export async function getWeeklyPlannerSummary(uid: string): Promise<WeeklyPlannerSummary> {
  const empty: WeeklyPlannerSummary = {
    hasData: false,
    completionPercent: 0,
    completedTasks: 0,
    totalTasks: 0,
    dayPercentages: [0, 0, 0, 0, 0, 0, 0],
    weekStart: getThisWeekStart(),
  };

  try {
    const todayYmd = toLocalYMD(getLocalNow());
    const weekStart = getThisWeekStart();
    const data = await loadWeeklyPlanner(uid, weekStart, todayYmd);
    const metrics = calculateWeeklyMetrics(data);
    const dayPercentages = metrics.dayMetricsList.map((d) => d.percent);

    return {
      hasData: metrics.overall.total > 0,
      completionPercent: metrics.overall.percent,
      completedTasks: metrics.overall.completed,
      totalTasks: metrics.overall.total,
      dayPercentages,
      weekStart,
    };
  } catch {
    return empty;
  }
}

export async function getHabitTrackerSummary(uid: string): Promise<HabitTrackerSummary> {
  const now = getLocalNow();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const empty: HabitTrackerSummary = {
    hasData: false,
    completionPercent: 0,
    completedChecks: 0,
    totalPossibleChecks: 0,
    habitsCount: 0,
    dailyPercentages: [],
    monthKey,
  };

  try {
    const state = await loadHabitMonth(uid, monthKey);
    const metrics = calculateMonthMetrics(state, daysInMonth);

    return {
      hasData: state.habits.length > 0,
      completionPercent: metrics.progressPercent,
      completedChecks: metrics.completedChecks,
      totalPossibleChecks: metrics.habitsCount * daysInMonth,
      habitsCount: metrics.habitsCount,
      dailyPercentages: metrics.perDayProgressPercent,
      monthKey,
    };
  } catch {
    return empty;
  }
}

export async function getTaskTrackerSummary(uid: string): Promise<TaskTrackerSummary> {
  const todayYmd = toLocalYMD(getLocalNow());

  const empty: TaskTrackerSummary = {
    hasData: false,
    totalTasks: 0,
    overdue: 0,
    completed: 0,
    notCompleted: 0,
    todayCount: 0,
    donePercent: 0,
  };

  try {
    const { tasks } = await loadTaskTracker(uid);
    const taskList = tasks?.tasks ?? [];
    const counters = getTaskCounters(taskList, todayYmd);
    const donePercent = taskList.length > 0
      ? Math.round((counters.completed / taskList.length) * 100)
      : 0;

    return {
      hasData: taskList.length > 0,
      totalTasks: counters.totalTasks,
      overdue: counters.overdue,
      completed: counters.completed,
      notCompleted: counters.notCompleted,
      todayCount: counters.today,
      donePercent,
    };
  } catch {
    return empty;
  }
}

export async function getFinanceTrackerSummary(uid: string): Promise<FinanceTrackerSummary> {
  const now = getLocalNow();
  const monthKey = toLocalYM(now);

  const empty: FinanceTrackerSummary = {
    hasData: false,
    monthBalance: 0,
    totalBalance: 0,
    actualIncome: 0,
    actualExpenses: 0,
    monthKey,
  };

  try {
    const settings = await loadFinanceSettings(uid);
    const monthState = await loadFinanceMonth(uid, monthKey, settings);
    const prevMonthKey = getPreviousMonthKey(monthKey);
    const previousState = await loadFinanceMonthIfExists(uid, prevMonthKey, settings);
    const overview = buildOverviewMetrics(
      monthState,
      previousState,
      settings,
      monthKey,
    );
    const { summary } = overview;

    return {
      hasData: true,
      monthBalance: summary.actualBalance,
      totalBalance: summary.actualTotalBalance,
      actualIncome: summary.actualIncome,
      actualExpenses: summary.actualExpenses,
      monthKey,
    };
  } catch {
    return empty;
  }
}
