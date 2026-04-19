import {
  DAY_INDICES,
  type DayIndex,
  type PlannerTask,
  type RecurringTask,
  type WeeklyPlannerData,
} from "./storage";

export interface DayMetric {
  dayIndex: DayIndex;
  completed: number;
  total: number;
  notCompleted: number;
  percent: number;
}

export interface OverallMetric {
  completed: number;
  total: number;
  percent: number;
}

export interface RecurringTaskMetric {
  id: string;
  name: string;
  checks: RecurringTask["checks"];
  completedDays: number;
  percent: number;
  isComplete: boolean;
}

export interface WeeklyMetrics {
  dayMetrics: Record<DayIndex, DayMetric>;
  dayMetricsList: DayMetric[];
  overall: OverallMetric;
  recurring: RecurringTaskMetric[];
}

function toPercent(completed: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function calculateDayMetric(tasks: PlannerTask[], dayIndex: DayIndex): DayMetric {
  const completed = tasks.filter((task) => task.done).length;
  const total = tasks.length;

  return {
    dayIndex,
    completed,
    total,
    notCompleted: total - completed,
    percent: toPercent(completed, total),
  };
}

function calculateRecurringMetric(task: RecurringTask): RecurringTaskMetric {
  const completedDays = task.checks.filter(Boolean).length;
  const percent = toPercent(completedDays, 7);

  return {
    id: task.id,
    name: task.name,
    checks: task.checks,
    completedDays,
    percent,
    isComplete: percent === 100,
  };
}

export function calculateWeeklyMetrics(data: WeeklyPlannerData): WeeklyMetrics {
  const dayMetricsList = DAY_INDICES.map((dayIndex) =>
    calculateDayMetric(data.tasksByDay[dayIndex] ?? [], dayIndex),
  );

  const dayMetrics = Object.fromEntries(
    dayMetricsList.map((metric) => [metric.dayIndex, metric]),
  ) as Record<DayIndex, DayMetric>;

  const overallCompleted = dayMetricsList.reduce(
    (sum, metric) => sum + metric.completed,
    0,
  );
  const overallTotal = dayMetricsList.reduce((sum, metric) => sum + metric.total, 0);

  return {
    dayMetrics,
    dayMetricsList,
    overall: {
      completed: overallCompleted,
      total: overallTotal,
      percent: toPercent(overallCompleted, overallTotal),
    },
    recurring: data.recurringTasks.map(calculateRecurringMetric),
  };
}
