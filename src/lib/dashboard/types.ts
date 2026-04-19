export interface WeeklyPlannerSummary {
  hasData: boolean;
  completionPercent: number;
  completedTasks: number;
  totalTasks: number;
  dayPercentages: number[];
  weekStart: string;
}

export interface HabitTrackerSummary {
  hasData: boolean;
  completionPercent: number;
  completedChecks: number;
  totalPossibleChecks: number;
  habitsCount: number;
  dailyPercentages: number[];
  monthKey: string;
}

export interface TaskTrackerSummary {
  hasData: boolean;
  totalTasks: number;
  overdue: number;
  completed: number;
  notCompleted: number;
  todayCount: number;
  donePercent: number;
}

export interface FinanceTrackerSummary {
  hasData: boolean;
  monthBalance: number;
  totalBalance: number;
  actualIncome: number;
  actualExpenses: number;
  monthKey: string;
}

export interface DashboardSummaries {
  weeklyPlanner: WeeklyPlannerSummary;
  habitTracker: HabitTrackerSummary;
  taskTracker: TaskTrackerSummary;
  financeTracker: FinanceTrackerSummary;
}
