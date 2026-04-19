import { MONTH_NAMES, getDaysInMonth } from "@/src/lib/date";
import { getLocalNow, toLocalYMD } from "@/src/lib/time/localTime";
import type {
  Habit,
  HabitMetric,
  HabitMonthMetrics,
  HabitMonthState,
  YearlyMonthStatistic,
  YearlyStatisticsCache,
} from "@/src/lib/habit-tracker/types";

function toPercent(value: number, total: number, precision = 2): number {
  if (!total) {
    return 0;
  }

  const multiplier = 10 ** precision;
  return Math.round(((value / total) * 100 + Number.EPSILON) * multiplier) / multiplier;
}

function normalizeGoal(goal: number | undefined, daysInMonth: number): number {
  if (!goal || Number.isNaN(goal) || goal <= 0) {
    return daysInMonth;
  }

  return Math.min(366, Math.max(1, Math.round(goal)));
}

function getChecksForHabit(
  checksByHabitId: HabitMonthState["checksByHabitId"],
  habit: Habit,
  daysInMonth: number,
): boolean[] {
  const checks = checksByHabitId[habit.id] ?? [];

  return Array.from({ length: daysInMonth }, (_, index) => Boolean(checks[index]));
}

export function calculateHabitMetrics(
  state: HabitMonthState,
  daysInMonth: number,
): HabitMetric[] {
  return state.habits.map((habit) => {
    const goal = normalizeGoal(habit.goal, daysInMonth);
    const checks = getChecksForHabit(state.checksByHabitId, habit, daysInMonth);
    const actual = checks.filter(Boolean).length;

    return {
      id: habit.id,
      name: habit.name,
      goal,
      actual,
      progressPercent: Math.min(100, toPercent(actual, goal)),
    };
  });
}

export function calculateMonthMetrics(
  state: HabitMonthState,
  daysInMonth: number,
): HabitMonthMetrics {
  const habitsCount = state.habits.length;

  const perDayDone = Array.from({ length: daysInMonth }, (_, dayIndex) =>
    state.habits.reduce((count, habit) => {
      const checks = state.checksByHabitId[habit.id] ?? [];
      return count + (checks[dayIndex] ? 1 : 0);
    }, 0),
  );

  const perDayNotDone = perDayDone.map((doneCount) =>
    Math.max(0, habitsCount - doneCount),
  );

  const perDayProgressPercent = perDayDone.map((doneCount) =>
    habitsCount ? Math.round((doneCount / habitsCount) * 100) : 0,
  );

  const completedChecks = perDayDone.reduce((sum, value) => sum + value, 0);
  const totalPossible = habitsCount * daysInMonth;

  return {
    habitsCount,
    completedChecks,
    totalPossible,
    progressPercent: toPercent(completedChecks, totalPossible),
    habitMetrics: calculateHabitMetrics(state, daysInMonth),
    perDayDone,
    perDayNotDone,
    perDayProgressPercent,
  };
}

export function calculateYearlyStatistics(
  year: number,
  loadMonthState: (year: number, monthIndex: number) => HabitMonthState | null,
): YearlyMonthStatistic[] {
  return MONTH_NAMES.map((monthName, monthIndex) => {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const state = loadMonthState(year, monthIndex);

    if (!state) {
      return {
        monthIndex,
        monthName,
        habitsCount: 0,
        completedChecks: 0,
        progressPercent: 0,
      } satisfies YearlyMonthStatistic;
    }

    const metrics = calculateMonthMetrics(state, daysInMonth);

    return {
      monthIndex,
      monthName,
      habitsCount: metrics.habitsCount,
      completedChecks: metrics.completedChecks,
      progressPercent: metrics.progressPercent,
    } satisfies YearlyMonthStatistic;
  });
}

export function buildYearStatisticsCache(
  year: number,
  months: YearlyMonthStatistic[],
): YearlyStatisticsCache {
  return {
    year,
    months,
    updatedAt: toLocalYMD(getLocalNow()),
  };
}
