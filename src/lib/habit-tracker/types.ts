export interface Habit {
  id: string;
  name: string;
  goal?: number;
}

export interface HabitMonthState {
  habits: Habit[];
  checksByHabitId: Record<string, boolean[]>;
  mood: number[];
  motivation: number[];
}

export interface HabitMetric {
  id: string;
  name: string;
  goal: number;
  actual: number;
  progressPercent: number;
}

export interface HabitMonthMetrics {
  habitsCount: number;
  completedChecks: number;
  totalPossible: number;
  progressPercent: number;
  habitMetrics: HabitMetric[];
  perDayDone: number[];
  perDayNotDone: number[];
  perDayProgressPercent: number[];
}

export interface YearlyMonthStatistic {
  monthIndex: number;
  monthName: string;
  habitsCount: number;
  completedChecks: number;
  progressPercent: number;
}

export interface YearlyStatisticsCache {
  year: number;
  months: YearlyMonthStatistic[];
  updatedAt: string;
}
