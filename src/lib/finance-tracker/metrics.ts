import { getPreviousMonthKey, isDateInMonth } from "@/src/lib/finance-tracker/date";
import type {
  FinanceMonthState,
  FinanceOverviewMetrics,
  FinanceSource,
  FinanceTrackerSettings,
  PieSlice,
} from "@/src/lib/finance-tracker/types";

const PIE_COLORS = [
  "#4b82d9",
  "#f24536",
  "#ff7a00",
  "#84c982",
  "#5db8b3",
  "#87a8e5",
  "#cf6d6d",
  "#c9d677",
  "#b58dd6",
  "#8fa8a8",
];

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function sum(values: number[]): number {
  return values.reduce((accumulator, value) => accumulator + value, 0);
}

function sourceNameById(sources: FinanceSource[]): Record<string, string> {
  return Object.fromEntries(sources.map((source) => [source.id, source.name]));
}

export function mapActualIncomeBySource(
  monthState: FinanceMonthState,
  monthKey: string,
): Record<string, number> {
  const result: Record<string, number> = {};

  monthState.dailyIncome.forEach((entry) => {
    if (!isDateInMonth(entry.date, monthKey)) {
      return;
    }

    result[entry.sourceId] = roundCurrency((result[entry.sourceId] ?? 0) + entry.amount);
  });

  return result;
}

export function mapActualExpensesByCategory(
  monthState: FinanceMonthState,
  monthKey: string,
): Record<string, number> {
  const result: Record<string, number> = {};

  monthState.dailyExpenses.forEach((entry) => {
    if (!isDateInMonth(entry.date, monthKey)) {
      return;
    }

    result[entry.categoryId] = roundCurrency((result[entry.categoryId] ?? 0) + entry.amount);
  });

  return result;
}

export function getPlanIncomeTotal(monthState: FinanceMonthState): number {
  return roundCurrency(sum(monthState.plannedIncome.map((entry) => entry.plan)));
}

export function getPlanExpensesTotal(monthState: FinanceMonthState): number {
  return roundCurrency(sum(monthState.plannedExpenses.map((entry) => entry.plan)));
}

export function getActualIncomeTotal(monthState: FinanceMonthState, monthKey: string): number {
  return roundCurrency(sum(Object.values(mapActualIncomeBySource(monthState, monthKey))));
}

export function getActualExpensesTotal(monthState: FinanceMonthState, monthKey: string): number {
  return roundCurrency(sum(Object.values(mapActualExpensesByCategory(monthState, monthKey))));
}

export function getDebtTotals(monthState: FinanceMonthState): {
  debt: number;
  paidOut: number;
  outstanding: number;
} {
  const debt = roundCurrency(sum(monthState.debts.map((entry) => entry.debt)));
  const paidOut = roundCurrency(sum(monthState.debts.map((entry) => entry.paidOut)));

  return {
    debt,
    paidOut,
    outstanding: roundCurrency(debt - paidOut),
  };
}

function toPieSlices(
  valuesById: Record<string, number>,
  sources: FinanceSource[],
): PieSlice[] {
  const labels = sourceNameById(sources);

  const slices = Object.entries(valuesById)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([id, value], index) => ({
      key: id,
      label: labels[id] ?? "Other",
      value,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));

  if (slices.length) {
    return slices;
  }

  return [
    {
      key: "empty",
      label: "No Data",
      value: 1,
      color: "#d9d9d9",
    },
  ];
}

export function buildOverviewMetrics(
  monthState: FinanceMonthState,
  previousMonthState: FinanceMonthState | null,
  settings: FinanceTrackerSettings,
  monthKey: string,
): FinanceOverviewMetrics {
  const actualIncomeBySource = mapActualIncomeBySource(monthState, monthKey);
  const actualExpensesByCategory = mapActualExpensesByCategory(monthState, monthKey);

  const plannedIncome = getPlanIncomeTotal(monthState);
  const plannedExpenses = getPlanExpensesTotal(monthState);
  const actualIncome = roundCurrency(sum(Object.values(actualIncomeBySource)));
  const actualExpenses = roundCurrency(sum(Object.values(actualExpensesByCategory)));

  const plannedBalance = roundCurrency(plannedIncome - plannedExpenses);
  const actualBalance = roundCurrency(actualIncome - actualExpenses);

  const debtTotals = getDebtTotals(monthState);

  let previousPlannedIncome = 0;
  let previousPlannedExpenses = 0;
  let previousActualIncome = 0;
  let previousActualExpenses = 0;

  if (previousMonthState) {
    const previousMonthKey = getPreviousMonthKey(monthKey);

    previousPlannedIncome = getPlanIncomeTotal(previousMonthState);
    previousPlannedExpenses = getPlanExpensesTotal(previousMonthState);
    previousActualIncome = getActualIncomeTotal(previousMonthState, previousMonthKey);
    previousActualExpenses = getActualExpensesTotal(previousMonthState, previousMonthKey);
  }

  const previousPlannedBalance = roundCurrency(previousPlannedIncome - previousPlannedExpenses);
  const previousActualBalance = roundCurrency(previousActualIncome - previousActualExpenses);

  const trends = {
    plan: roundCurrency(plannedBalance - previousPlannedBalance),
    actual: roundCurrency(actualBalance - previousActualBalance),
    incomeActualDiff: roundCurrency(actualIncome - previousActualIncome),
    expenseActualDiff: roundCurrency(actualExpenses - previousActualExpenses),
  };

  return {
    summary: {
      plannedIncome,
      actualIncome,
      plannedExpenses,
      actualExpenses,
      plannedBalance,
      actualBalance,
      plannedTotalBalance: roundCurrency(monthState.startingAmount + plannedBalance),
      actualTotalBalance: roundCurrency(monthState.startingAmount + actualBalance),
      totalDebt: debtTotals.debt,
      paidOut: debtTotals.paidOut,
      outstandingDebt: debtTotals.outstanding,
    },
    trends,
    incomeBySource: toPieSlices(actualIncomeBySource, settings.incomeSources),
    expensesByCategory: toPieSlices(actualExpensesByCategory, settings.expenseCategories),
    planActualBars: [
      {
        label: "Income",
        plan: plannedIncome,
        actual: actualIncome,
      },
      {
        label: "Expenses",
        plan: plannedExpenses,
        actual: actualExpenses,
      },
    ],
    actualIncomeBySource,
    actualExpensesByCategory,
  };
}
