export interface FinanceSource {
  id: string;
  name: string;
}

export interface PlannedIncomeRow {
  id: string;
  sourceId: string;
  plan: number;
}

export interface PlannedExpenseRow {
  id: string;
  categoryId: string;
  plan: number;
}

export interface DebtRow {
  id: string;
  sourceId: string;
  debt: number;
  paidOut: number;
}

export interface DailyIncomeRow {
  id: string;
  date: string;
  sourceId: string;
  amount: number;
  note?: string;
}

export interface DailyExpenseRow {
  id: string;
  date: string;
  categoryId: string;
  amount: number;
  note?: string;
}

export interface FinanceTrackerSettings {
  incomeSources: FinanceSource[];
  expenseCategories: FinanceSource[];
  debtSources: FinanceSource[];
}

export interface FinanceMonthState {
  monthKey: string;
  startingAmount: number;
  plannedIncome: PlannedIncomeRow[];
  plannedExpenses: PlannedExpenseRow[];
  debts: DebtRow[];
  dailyIncome: DailyIncomeRow[];
  dailyExpenses: DailyExpenseRow[];
}

export interface PieSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface PlanActualBarItem {
  label: string;
  plan: number;
  actual: number;
}

export interface FinanceSummary {
  plannedIncome: number;
  actualIncome: number;
  plannedExpenses: number;
  actualExpenses: number;
  plannedBalance: number;
  actualBalance: number;
  plannedTotalBalance: number;
  actualTotalBalance: number;
  totalDebt: number;
  paidOut: number;
  outstandingDebt: number;
}

export interface FinanceTrends {
  plan: number;
  actual: number;
  incomeActualDiff: number;
  expenseActualDiff: number;
}

export interface FinanceOverviewMetrics {
  summary: FinanceSummary;
  trends: FinanceTrends;
  incomeBySource: PieSlice[];
  expensesByCategory: PieSlice[];
  planActualBars: PlanActualBarItem[];
  actualIncomeBySource: Record<string, number>;
  actualExpensesByCategory: Record<string, number>;
}
