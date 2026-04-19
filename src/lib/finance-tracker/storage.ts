import { debounce, readStorageJSON, readStorageString, writeStorageJSON, writeStorageString } from "@/src/lib/storage";
import {
  buildMonthDate,
  getCurrentMonthKey,
  parseMonthKey,
  toMonthKey,
} from "@/src/lib/finance-tracker/date";
import type {
  DailyExpenseRow,
  DailyIncomeRow,
  DebtRow,
  FinanceMonthState,
  FinanceSource,
  FinanceTrackerSettings,
  PlannedExpenseRow,
  PlannedIncomeRow,
} from "@/src/lib/finance-tracker/types";

export const FINANCE_SETTINGS_KEY = "finance-tracker:settings";
export const FINANCE_SELECTED_MONTH_KEY = "finance-tracker:selected-month";

const MONTH_PREFIX = "finance-tracker:";

const DEFAULT_INCOME_NAMES = [
  "Salary",
  "Bonus",
  "Freelance",
  "Business / Dividends",
  "Investments & Deposits",
  "Real Estate",
  "Transfer from family / friends",
  "Transfer from third parties",
  "Debt repayment",
  "Selling items",
  "Scholarship / Grant",
  "Social benefits",
  "Other income",
];

const DEFAULT_EXPENSE_NAMES = [
  "Rent",
  "Mobile phone",
  "Internet",
  "Insurance",
  "Subscriptions",
  "Utilities",
  "Family",
  "Pets",
  "Personal",
  "Self-care",
  "Charity",
  "Transportation",
  "Taxi",
  "Food",
  "Cafes & Restaurants",
  "Car",
  "Gasoline",
  "Travel",
];

const DEFAULT_DEBT_NAMES = ["Loans", "Debts", "Credit Cards", "Mortgage", "Liabilities"];

export function createFinanceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function normalizeSources(value: unknown, fallbackNames: readonly string[]): FinanceSource[] {
  if (!Array.isArray(value)) {
    return fallbackNames.map((name) => ({ id: createFinanceId(), name }));
  }

  const sources = value
    .map((entry): FinanceSource | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;
      const name = typeof source.name === "string" ? source.name.trim() : "";

      if (!name) {
        return null;
      }

      return {
        id: typeof source.id === "string" ? source.id : createFinanceId(),
        name,
      };
    })
    .filter((entry): entry is FinanceSource => entry !== null);

  if (sources.length) {
    return sources;
  }

  return fallbackNames.map((name) => ({ id: createFinanceId(), name }));
}

function normalizeSettings(raw: unknown): FinanceTrackerSettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    incomeSources: normalizeSources(source.incomeSources, DEFAULT_INCOME_NAMES),
    expenseCategories: normalizeSources(source.expenseCategories, DEFAULT_EXPENSE_NAMES),
    debtSources: normalizeSources(source.debtSources, DEFAULT_DEBT_NAMES),
  };
}

function getMonthStorageKey(monthKey: string): string {
  return `${MONTH_PREFIX}${monthKey}`;
}

function normalizePlannedIncomeRows(value: unknown): PlannedIncomeRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): PlannedIncomeRow | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;

      if (typeof source.sourceId !== "string") {
        return null;
      }

      return {
        id: typeof source.id === "string" ? source.id : createFinanceId(),
        sourceId: source.sourceId,
        plan: toNumber(source.plan),
      };
    })
    .filter((entry): entry is PlannedIncomeRow => entry !== null);
}

function normalizePlannedExpenseRows(value: unknown): PlannedExpenseRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): PlannedExpenseRow | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;

      if (typeof source.categoryId !== "string") {
        return null;
      }

      return {
        id: typeof source.id === "string" ? source.id : createFinanceId(),
        categoryId: source.categoryId,
        plan: toNumber(source.plan),
      };
    })
    .filter((entry): entry is PlannedExpenseRow => entry !== null);
}

function normalizeDebtRows(value: unknown): DebtRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): DebtRow | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;

      if (typeof source.sourceId !== "string") {
        return null;
      }

      return {
        id: typeof source.id === "string" ? source.id : createFinanceId(),
        sourceId: source.sourceId,
        debt: toNumber(source.debt),
        paidOut: toNumber(source.paidOut),
      };
    })
    .filter((entry): entry is DebtRow => entry !== null);
}

function normalizeIncomeLogs(value: unknown, monthKey: string): DailyIncomeRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): DailyIncomeRow | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;

      if (typeof source.sourceId !== "string") {
        return null;
      }

      return {
        id: typeof source.id === "string" ? source.id : createFinanceId(),
        date: typeof source.date === "string" ? source.date : buildMonthDate(monthKey, 1),
        sourceId: source.sourceId,
        amount: toNumber(source.amount),
        note: typeof source.note === "string" ? source.note : "",
      };
    })
    .filter((entry): entry is DailyIncomeRow => entry !== null);
}

function normalizeExpenseLogs(value: unknown, monthKey: string): DailyExpenseRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): DailyExpenseRow | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;

      if (typeof source.categoryId !== "string") {
        return null;
      }

      return {
        id: typeof source.id === "string" ? source.id : createFinanceId(),
        date: typeof source.date === "string" ? source.date : buildMonthDate(monthKey, 1),
        categoryId: source.categoryId,
        amount: toNumber(source.amount),
        note: typeof source.note === "string" ? source.note : "",
      };
    })
    .filter((entry): entry is DailyExpenseRow => entry !== null);
}

function createDefaultMonthState(
  monthKey: string,
  _settings: FinanceTrackerSettings,
): FinanceMonthState {
  return {
    monthKey,
    startingAmount: 0,
    plannedIncome: [],
    plannedExpenses: [],
    debts: [],
    dailyIncome: [],
    dailyExpenses: [],
  };
}

function normalizeMonthState(
  monthKey: string,
  raw: unknown,
  settings: FinanceTrackerSettings,
): FinanceMonthState {
  if (!raw || typeof raw !== "object") {
    return createDefaultMonthState(monthKey, settings);
  }

  const source = raw as Record<string, unknown>;

  return {
    monthKey,
    startingAmount: toNumber(source.startingAmount),
    plannedIncome: normalizePlannedIncomeRows(source.plannedIncome),
    plannedExpenses: normalizePlannedExpenseRows(source.plannedExpenses),
    debts: normalizeDebtRows(source.debts),
    dailyIncome: normalizeIncomeLogs(source.dailyIncome, monthKey),
    dailyExpenses: normalizeExpenseLogs(source.dailyExpenses, monthKey),
  };
}

export function normalizeFinanceSettings(raw: unknown): FinanceTrackerSettings {
  return normalizeSettings(raw);
}

export function normalizeFinanceMonthState(
  monthKey: string,
  raw: unknown,
  settings: FinanceTrackerSettings,
): FinanceMonthState {
  return normalizeMonthState(monthKey, raw, settings);
}

export function loadFinanceSettings(): FinanceTrackerSettings {
  const raw = readStorageJSON<unknown | null>(FINANCE_SETTINGS_KEY, null);
  const settings = normalizeSettings(raw);

  if (raw === null) {
    writeStorageJSON(FINANCE_SETTINGS_KEY, settings);
  }

  return settings;
}

export function saveFinanceSettings(settings: FinanceTrackerSettings): void {
  writeStorageJSON(FINANCE_SETTINGS_KEY, settings);
}

export function loadFinanceMonthState(
  monthKey: string,
  settings?: FinanceTrackerSettings,
): FinanceMonthState {
  const safeMonthKey = parseMonthKey(monthKey) ? monthKey : getCurrentMonthKey();
  const safeSettings = settings ?? loadFinanceSettings();
  const storageKey = getMonthStorageKey(safeMonthKey);

  const raw = readStorageJSON<unknown | null>(storageKey, null);
  const normalized = normalizeMonthState(safeMonthKey, raw, safeSettings);

  if (raw === null) {
    writeStorageJSON(storageKey, normalized);
  }

  return normalized;
}

export function loadFinanceMonthStateIfExists(
  monthKey: string,
  settings?: FinanceTrackerSettings,
): FinanceMonthState | null {
  const safeMonthKey = parseMonthKey(monthKey) ? monthKey : getCurrentMonthKey();
  const storageKey = getMonthStorageKey(safeMonthKey);
  const rawString = readStorageString(storageKey, "");

  if (!rawString) {
    return null;
  }

  const raw = readStorageJSON<unknown | null>(storageKey, null);
  return normalizeMonthState(safeMonthKey, raw, settings ?? loadFinanceSettings());
}

export function saveFinanceMonthState(monthKey: string, state: FinanceMonthState): void {
  const safeMonthKey = parseMonthKey(monthKey) ? monthKey : getCurrentMonthKey();

  writeStorageJSON(getMonthStorageKey(safeMonthKey), {
    ...state,
    monthKey: safeMonthKey,
  });
}

export function loadSelectedFinanceMonthKey(): string {
  const fallback = getCurrentMonthKey();
  const raw = readStorageString(FINANCE_SELECTED_MONTH_KEY, "");

  if (!raw) {
    return fallback;
  }

  return parseMonthKey(raw) ? raw : fallback;
}

export function saveSelectedFinanceMonthKey(monthKey: string): void {
  if (!parseMonthKey(monthKey)) {
    return;
  }

  writeStorageString(FINANCE_SELECTED_MONTH_KEY, monthKey);
}

export const debouncedSaveFinanceSettings = debounce(saveFinanceSettings, 300);
export const debouncedSaveFinanceMonthState = debounce(saveFinanceMonthState, 300);

export function monthSelectionToKey(year: number, monthIndex: number): string {
  return toMonthKey(year, monthIndex);
}
