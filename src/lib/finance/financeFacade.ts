import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import {
  loadFinanceMonth,
  loadFinanceMonthIfExists,
  loadFinanceSettings,
  saveFinanceMonth,
} from "@/src/lib/db/store";
import { firestore } from "@/src/lib/firebase/client";
import { getLocalNow, isBeforeLocal, toLocalYM, toLocalYMD } from "@/src/lib/time/localTime";
import type {
  DailyExpenseRow,
  DailyIncomeRow,
  DebtRow,
  FinanceMonthState,
  FinanceTrackerSettings,
} from "@/src/lib/finance-tracker/types";

export type FinanceFrequency = "weekly" | "biweekly" | "monthly";

export interface FinanceIncomeStream {
  id: string;
  name: string;
  amount: number;
  frequency: FinanceFrequency;
}

export interface FinanceRecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: FinanceFrequency;
  category: string;
}

export interface FinanceDebt {
  id: string;
  name: string;
  currentBalance: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDay?: number;
}

export type FinanceTransactionType = "income" | "expense";

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface FinanceOverviewTotals {
  monthIncome: number;
  monthExpenses: number;
  net: number;
  debtTotal: number;
}

export interface FinanceCategorySuggestions {
  income: string[];
  expense: string[];
}

export interface FinanceSnapshot {
  incomeStreams: FinanceIncomeStream[];
  recurringExpenses: FinanceRecurringExpense[];
  debts: FinanceDebt[];
  transactions: FinanceTransaction[];
  overview: FinanceOverviewTotals;
  categorySuggestions: FinanceCategorySuggestions;
}

interface EditableIncomeStream {
  name?: unknown;
  amount?: unknown;
  frequency?: unknown;
}

interface EditableRecurringExpense {
  name?: unknown;
  amount?: unknown;
  frequency?: unknown;
  category?: unknown;
}

interface EditableDebt {
  name?: unknown;
  currentBalance?: unknown;
  interestRate?: unknown;
  minimumPayment?: unknown;
  dueDay?: unknown;
}

interface EditableTransaction {
  type?: unknown;
  amount?: unknown;
  category?: unknown;
  note?: unknown;
  date?: unknown;
}

const frequencyDays: Record<FinanceFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

type LegacyMonthlyRowType =
  | "plannedIncome"
  | "plannedExpenses"
  | "debts"
  | "dailyIncome"
  | "dailyExpenses";

type DeleteFinanceEntityType = "incomeStream" | "recurringExpense" | "debt" | "transaction";

interface DeleteFinanceEntityInput {
  uid: string;
  entity: DeleteFinanceEntityType;
  id: string;
  monthKey?: string;
  transactionType?: FinanceTransactionType;
}

interface DeleteTransactionOptions {
  monthKey?: string;
  type?: FinanceTransactionType;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  return Math.max(0, toNumber(value, fallback));
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalPositiveInt(value: unknown): number | undefined {
  const parsed = toOptionalNumber(value);

  if (parsed === undefined) {
    return undefined;
  }

  const intValue = Math.floor(parsed);

  if (intValue < 1 || intValue > 31) {
    return undefined;
  }

  return intValue;
}

function toCleanText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function toFinanceFrequency(value: unknown): FinanceFrequency {
  if (value === "weekly" || value === "biweekly" || value === "monthly") {
    return value;
  }

  return "monthly";
}

function toYmdOrFallback(value: unknown, fallbackYmd: string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return fallbackYmd;
}

function clampDateToJoin(dateYmd: string, joinDateYmd: string): string {
  return isBeforeLocal(dateYmd, joinDateYmd) ? joinDateYmd : dateYmd;
}

function sourceNameById(items: { id: string; name: string }[]): Record<string, string> {
  return Object.fromEntries(items.map((entry) => [entry.id, entry.name]));
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(normalized);
  });

  return result;
}

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sortTransactions(items: FinanceTransaction[]): FinanceTransaction[] {
  return [...items].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date < right.date ? 1 : -1;
    }

    return left.id.localeCompare(right.id);
  });
}

function mergeById<T extends { id: string }>(primary: T[], legacy: T[]): T[] {
  const byId = new Map<string, T>();

  primary.forEach((item) => {
    byId.set(item.id, item);
  });

  legacy.forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });

  return Array.from(byId.values());
}

function monthStartYmd(monthKey: string): string {
  return `${monthKey}-01`;
}

function monthEndYmd(monthKey: string): string {
  return `${monthKey}-31`;
}

function daysInMonth(monthKey: string): number {
  const parts = monthKey.match(/^(\d{4})-(\d{2})$/);

  if (!parts) {
    return 30;
  }

  const year = Number(parts[1]);
  const month = Number(parts[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return 30;
  }

  return new Date(year, month, 0).getDate();
}

function isDateInMonth(dateYmd: string, monthKey: string): boolean {
  return dateYmd.startsWith(`${monthKey}-`);
}

function toMonthKeyOrCurrent(monthKey?: string): string {
  if (typeof monthKey === "string" && /^\d{4}-\d{2}$/.test(monthKey)) {
    return monthKey;
  }

  return toLocalYM(getLocalNow());
}

function proratedForMonth(amount: number, frequency: FinanceFrequency, monthKey: string): number {
  if (frequency === "monthly") {
    return roundMoney(amount);
  }

  return roundMoney(amount * (daysInMonth(monthKey) / frequencyDays[frequency]));
}

function toLegacyIncomeRows(transactions: FinanceTransaction[]): DailyIncomeRow[] {
  return transactions
    .filter((entry) => entry.type === "income")
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      sourceId: entry.category || "income",
      amount: entry.amount,
      note: entry.note,
    }));
}

function toLegacyExpenseRows(transactions: FinanceTransaction[]): DailyExpenseRow[] {
  return transactions
    .filter((entry) => entry.type === "expense")
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      categoryId: entry.category || "expense",
      amount: entry.amount,
      note: entry.note,
    }));
}

function toLegacyDebtRows(debts: FinanceDebt[]): DebtRow[] {
  return debts.map((entry) => ({
    id: entry.id,
    sourceId: entry.name || entry.id,
    debt: entry.currentBalance,
    paidOut: 0,
  }));
}

function mapLegacyIncomeStreams(
  legacyMonth: FinanceMonthState,
  settings: FinanceTrackerSettings,
): FinanceIncomeStream[] {
  const namesById = sourceNameById(settings.incomeSources);

  return legacyMonth.plannedIncome.map((entry) => ({
    id: entry.id,
    name: namesById[entry.sourceId] ?? entry.sourceId,
    amount: toNonNegativeNumber(entry.plan),
    frequency: "monthly",
  }));
}

function mapLegacyRecurringExpenses(
  legacyMonth: FinanceMonthState,
  settings: FinanceTrackerSettings,
): FinanceRecurringExpense[] {
  const namesById = sourceNameById(settings.expenseCategories);

  return legacyMonth.plannedExpenses.map((entry) => {
    const name = namesById[entry.categoryId] ?? entry.categoryId;

    return {
      id: entry.id,
      name,
      amount: toNonNegativeNumber(entry.plan),
      frequency: "monthly",
      category: name,
    };
  });
}

function mapLegacyDebts(
  legacyMonth: FinanceMonthState,
  settings: FinanceTrackerSettings,
): FinanceDebt[] {
  const namesById = sourceNameById(settings.debtSources);

  return legacyMonth.debts.map((entry) => ({
    id: entry.id,
    name: namesById[entry.sourceId] ?? entry.sourceId,
    currentBalance: roundMoney(Math.max(0, toNonNegativeNumber(entry.debt) - toNonNegativeNumber(entry.paidOut))),
  }));
}

function mapLegacyTransactions(
  legacyMonth: FinanceMonthState,
  monthKey: string,
  settings: FinanceTrackerSettings,
): FinanceTransaction[] {
  const incomeNamesById = sourceNameById(settings.incomeSources);
  const expenseNamesById = sourceNameById(settings.expenseCategories);

  const incomeRows = legacyMonth.dailyIncome
    .filter((entry) => isDateInMonth(entry.date, monthKey))
    .map((entry) => ({
      id: entry.id,
      type: "income" as const,
      amount: toNonNegativeNumber(entry.amount),
      category: incomeNamesById[entry.sourceId] ?? entry.sourceId,
      note: toCleanText(entry.note),
      date: toYmdOrFallback(entry.date, monthStartYmd(monthKey)),
    }));

  const expenseRows = legacyMonth.dailyExpenses
    .filter((entry) => isDateInMonth(entry.date, monthKey))
    .map((entry) => ({
      id: entry.id,
      type: "expense" as const,
      amount: toNonNegativeNumber(entry.amount),
      category: expenseNamesById[entry.categoryId] ?? entry.categoryId,
      note: toCleanText(entry.note),
      date: toYmdOrFallback(entry.date, monthStartYmd(monthKey)),
    }));

  return sortTransactions([...incomeRows, ...expenseRows]);
}

async function loadIncomeStreamDocs(uid: string): Promise<FinanceIncomeStream[]> {
  const snap = await getDocs(collection(firestore, "users", uid, "financeIncomeStreams"));

  return sortByName(
    snap.docs.map((entry) => {
      const data = entry.data() as EditableIncomeStream;

      return {
        id: entry.id,
        name: toCleanText(data.name, "Income stream"),
        amount: toNonNegativeNumber(data.amount),
        frequency: toFinanceFrequency(data.frequency),
      };
    }),
  );
}

async function loadRecurringExpenseDocs(uid: string): Promise<FinanceRecurringExpense[]> {
  const snap = await getDocs(collection(firestore, "users", uid, "financeRecurringExpenses"));

  return sortByName(
    snap.docs.map((entry) => {
      const data = entry.data() as EditableRecurringExpense;

      return {
        id: entry.id,
        name: toCleanText(data.name, "Recurring expense"),
        amount: toNonNegativeNumber(data.amount),
        frequency: toFinanceFrequency(data.frequency),
        category: toCleanText(data.category),
      };
    }),
  );
}

async function loadDebtDocs(uid: string): Promise<FinanceDebt[]> {
  const snap = await getDocs(collection(firestore, "users", uid, "financeDebts"));

  return sortByName(
    snap.docs.map((entry) => {
      const data = entry.data() as EditableDebt;

      return {
        id: entry.id,
        name: toCleanText(data.name, "Debt"),
        currentBalance: toNonNegativeNumber(data.currentBalance),
        interestRate: toOptionalNumber(data.interestRate),
        minimumPayment: toOptionalNumber(data.minimumPayment),
        dueDay: toOptionalPositiveInt(data.dueDay),
      };
    }),
  );
}

async function loadTransactionDocs(uid: string, monthKey: string): Promise<FinanceTransaction[]> {
  const txCollection = collection(firestore, "users", uid, "financeTransactions");
  const start = monthStartYmd(monthKey);
  const end = monthEndYmd(monthKey);

  let docs = await getDocs(query(txCollection, where("date", ">=", start), where("date", "<=", end)));

  if (docs.empty) {
    docs = await getDocs(txCollection);
  }

  const fallbackDate = start;

  const normalized = docs.docs
    .map((entry) => {
      const data = entry.data() as EditableTransaction;
      const date = toYmdOrFallback(data.date, fallbackDate);

      if (!isDateInMonth(date, monthKey)) {
        return null;
      }

      return {
        id: entry.id,
        type: data.type === "income" ? "income" : "expense",
        amount: toNonNegativeNumber(data.amount),
        category: toCleanText(data.category),
        note: toCleanText(data.note),
        date,
      } satisfies FinanceTransaction;
    })
    .filter((entry): entry is FinanceTransaction => entry !== null);

  return sortTransactions(normalized);
}

async function syncLegacyMonthFromNewData(
  uid: string,
  monthKey: string,
  options: { syncTransactions?: boolean; syncDebts?: boolean },
): Promise<void> {
  try {
    const settings = await loadFinanceSettings(uid);
    const legacyMonth = await loadFinanceMonth(uid, monthKey, settings);
    const nextState: FinanceMonthState = {
      ...legacyMonth,
    };

    if (options.syncTransactions) {
      const transactions = await loadTransactionDocs(uid, monthKey);
      nextState.dailyIncome = toLegacyIncomeRows(transactions);
      nextState.dailyExpenses = toLegacyExpenseRows(transactions);
    }

    if (options.syncDebts) {
      const debts = await loadDebtDocs(uid);
      nextState.debts = toLegacyDebtRows(debts);
    }

    await saveFinanceMonth(uid, monthKey, nextState);
  } catch {
    // Legacy sync is best-effort for compatibility with existing consumers.
  }
}

export async function deleteLegacyMonthlyRowIfPresent(input: {
  uid: string;
  monthKey: string;
  rowId: string;
  rowType: LegacyMonthlyRowType;
}): Promise<boolean> {
  const safeMonthKey = toMonthKeyOrCurrent(input.monthKey);
  const settings = await loadFinanceSettings(input.uid);
  const legacyMonth = await loadFinanceMonthIfExists(input.uid, safeMonthKey, settings);

  if (!legacyMonth) {
    return false;
  }

  const nextState: FinanceMonthState = {
    ...legacyMonth,
  };

  switch (input.rowType) {
    case "plannedIncome": {
      nextState.plannedIncome = legacyMonth.plannedIncome.filter((entry) => entry.id !== input.rowId);
      break;
    }
    case "plannedExpenses": {
      nextState.plannedExpenses = legacyMonth.plannedExpenses.filter((entry) => entry.id !== input.rowId);
      break;
    }
    case "debts": {
      nextState.debts = legacyMonth.debts.filter((entry) => entry.id !== input.rowId);
      break;
    }
    case "dailyIncome": {
      nextState.dailyIncome = legacyMonth.dailyIncome.filter((entry) => entry.id !== input.rowId);
      break;
    }
    case "dailyExpenses": {
      nextState.dailyExpenses = legacyMonth.dailyExpenses.filter((entry) => entry.id !== input.rowId);
      break;
    }
    default: {
      return false;
    }
  }

  const changed =
    nextState.plannedIncome.length !== legacyMonth.plannedIncome.length
    || nextState.plannedExpenses.length !== legacyMonth.plannedExpenses.length
    || nextState.debts.length !== legacyMonth.debts.length
    || nextState.dailyIncome.length !== legacyMonth.dailyIncome.length
    || nextState.dailyExpenses.length !== legacyMonth.dailyExpenses.length;

  if (!changed) {
    return false;
  }

  await saveFinanceMonth(input.uid, safeMonthKey, nextState);
  return true;
}

async function deleteFinanceEntity(input: DeleteFinanceEntityInput): Promise<void> {
  const safeMonthKey = toMonthKeyOrCurrent(input.monthKey);
  const operations: Array<Promise<unknown>> = [];

  if (input.entity === "incomeStream") {
    operations.push(
      deleteDoc(doc(firestore, "users", input.uid, "financeIncomeStreams", input.id)),
      deleteLegacyMonthlyRowIfPresent({
        uid: input.uid,
        monthKey: safeMonthKey,
        rowId: input.id,
        rowType: "plannedIncome",
      }),
    );
  }

  if (input.entity === "recurringExpense") {
    operations.push(
      deleteDoc(doc(firestore, "users", input.uid, "financeRecurringExpenses", input.id)),
      deleteLegacyMonthlyRowIfPresent({
        uid: input.uid,
        monthKey: safeMonthKey,
        rowId: input.id,
        rowType: "plannedExpenses",
      }),
    );
  }

  if (input.entity === "debt") {
    operations.push(
      deleteDoc(doc(firestore, "users", input.uid, "financeDebts", input.id)),
      deleteLegacyMonthlyRowIfPresent({
        uid: input.uid,
        monthKey: safeMonthKey,
        rowId: input.id,
        rowType: "debts",
      }),
    );
  }

  if (input.entity === "transaction") {
    operations.push(
      deleteDoc(doc(firestore, "users", input.uid, "financeTransactions", input.id)),
    );

    if (input.transactionType === "income") {
      operations.push(
        deleteLegacyMonthlyRowIfPresent({
          uid: input.uid,
          monthKey: safeMonthKey,
          rowId: input.id,
          rowType: "dailyIncome",
        }),
      );
    } else if (input.transactionType === "expense") {
      operations.push(
        deleteLegacyMonthlyRowIfPresent({
          uid: input.uid,
          monthKey: safeMonthKey,
          rowId: input.id,
          rowType: "dailyExpenses",
        }),
      );
    } else {
      operations.push(
        deleteLegacyMonthlyRowIfPresent({
          uid: input.uid,
          monthKey: safeMonthKey,
          rowId: input.id,
          rowType: "dailyIncome",
        }),
        deleteLegacyMonthlyRowIfPresent({
          uid: input.uid,
          monthKey: safeMonthKey,
          rowId: input.id,
          rowType: "dailyExpenses",
        }),
      );
    }
  }

  const results = await Promise.allSettled(operations);
  const failure = results.find((result) => result.status === "rejected");

  if (failure && failure.status === "rejected") {
    throw failure.reason;
  }
}

function buildCategorySuggestions({
  incomeStreams,
  recurringExpenses,
  transactions,
  settings,
}: {
  incomeStreams: FinanceIncomeStream[];
  recurringExpenses: FinanceRecurringExpense[];
  transactions: FinanceTransaction[];
  settings: FinanceTrackerSettings;
}): FinanceCategorySuggestions {
  const income = uniqueStrings([
    ...incomeStreams.map((entry) => entry.name),
    ...settings.incomeSources.map((entry) => entry.name),
    ...transactions
      .filter((entry) => entry.type === "income")
      .map((entry) => entry.category),
  ]);

  const expense = uniqueStrings([
    ...recurringExpenses.flatMap((entry) => [entry.category, entry.name]),
    ...settings.expenseCategories.map((entry) => entry.name),
    ...transactions
      .filter((entry) => entry.type === "expense")
      .map((entry) => entry.category),
  ]);

  return {
    income,
    expense,
  };
}

export function calculateMonthlyOverview({
  monthKey,
  incomeStreams,
  recurringExpenses,
  debts,
  transactions,
}: {
  monthKey: string;
  incomeStreams: FinanceIncomeStream[];
  recurringExpenses: FinanceRecurringExpense[];
  debts: FinanceDebt[];
  transactions: FinanceTransaction[];
}): FinanceOverviewTotals {
  const recurringIncome = roundMoney(
    incomeStreams.reduce(
      (sum, entry) => sum + proratedForMonth(entry.amount, entry.frequency, monthKey),
      0,
    ),
  );

  const recurringExpense = roundMoney(
    recurringExpenses.reduce(
      (sum, entry) => sum + proratedForMonth(entry.amount, entry.frequency, monthKey),
      0,
    ),
  );

  const loggedIncome = roundMoney(
    transactions
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );

  const loggedExpense = roundMoney(
    transactions
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0),
  );

  const monthIncome = roundMoney(recurringIncome + loggedIncome);
  const monthExpenses = roundMoney(recurringExpense + loggedExpense);
  const debtTotal = roundMoney(debts.reduce((sum, entry) => sum + entry.currentBalance, 0));

  return {
    monthIncome,
    monthExpenses,
    net: roundMoney(monthIncome - monthExpenses),
    debtTotal,
  };
}

export async function loadFinanceSnapshot(uid: string, monthKey: string): Promise<FinanceSnapshot> {
  const settings = await loadFinanceSettings(uid);

  const [incomeDocs, expenseDocs, debtDocs, transactionDocs, legacyMonth] = await Promise.all([
    loadIncomeStreamDocs(uid),
    loadRecurringExpenseDocs(uid),
    loadDebtDocs(uid),
    loadTransactionDocs(uid, monthKey),
    loadFinanceMonth(uid, monthKey, settings),
  ]);

  const legacyIncome = mapLegacyIncomeStreams(legacyMonth, settings);
  const legacyExpenses = mapLegacyRecurringExpenses(legacyMonth, settings);
  const legacyDebts = mapLegacyDebts(legacyMonth, settings);
  const legacyTransactions = mapLegacyTransactions(legacyMonth, monthKey, settings);

  const incomeStreams = sortByName(mergeById(incomeDocs, legacyIncome));
  const recurringExpenses = sortByName(mergeById(expenseDocs, legacyExpenses));
  const debts = sortByName(mergeById(debtDocs, legacyDebts));
  const transactions = sortTransactions(mergeById(transactionDocs, legacyTransactions));

  return {
    incomeStreams,
    recurringExpenses,
    debts,
    transactions,
    overview: calculateMonthlyOverview({
      monthKey,
      incomeStreams,
      recurringExpenses,
      debts,
      transactions,
    }),
    categorySuggestions: buildCategorySuggestions({
      incomeStreams,
      recurringExpenses,
      transactions,
      settings,
    }),
  };
}

export async function createIncomeStream(
  uid: string,
  input: { name: string; amount: number; frequency?: FinanceFrequency },
): Promise<FinanceIncomeStream> {
  const ref = doc(collection(firestore, "users", uid, "financeIncomeStreams"));

  const record = {
    name: toCleanText(input.name, "Income stream"),
    amount: toNonNegativeNumber(input.amount),
    frequency: toFinanceFrequency(input.frequency),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, record, { merge: true });

  return {
    id: ref.id,
    name: record.name,
    amount: record.amount,
    frequency: record.frequency,
  };
}

export async function updateIncomeStream(
  uid: string,
  id: string,
  patch: Partial<FinanceIncomeStream>,
): Promise<void> {
  const payload: EditableIncomeStream = {};

  if (patch.name !== undefined) {
    payload.name = toCleanText(patch.name, "Income stream");
  }

  if (patch.amount !== undefined) {
    payload.amount = toNonNegativeNumber(patch.amount);
  }

  if (patch.frequency !== undefined) {
    payload.frequency = toFinanceFrequency(patch.frequency);
  }

  await setDoc(
    doc(firestore, "users", uid, "financeIncomeStreams", id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteIncomeStream(
  uid: string,
  id: string,
  monthKey?: string,
): Promise<void> {
  await deleteFinanceEntity({
    uid,
    entity: "incomeStream",
    id,
    monthKey,
  });
}

export async function createRecurringExpense(
  uid: string,
  input: { name: string; amount: number; frequency?: FinanceFrequency; category?: string },
): Promise<FinanceRecurringExpense> {
  const ref = doc(collection(firestore, "users", uid, "financeRecurringExpenses"));

  const record = {
    name: toCleanText(input.name, "Recurring expense"),
    amount: toNonNegativeNumber(input.amount),
    frequency: toFinanceFrequency(input.frequency),
    category: toCleanText(input.category),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, record, { merge: true });

  return {
    id: ref.id,
    name: record.name,
    amount: record.amount,
    frequency: record.frequency,
    category: record.category,
  };
}

export async function updateRecurringExpense(
  uid: string,
  id: string,
  patch: Partial<FinanceRecurringExpense>,
): Promise<void> {
  const payload: EditableRecurringExpense = {};

  if (patch.name !== undefined) {
    payload.name = toCleanText(patch.name, "Recurring expense");
  }

  if (patch.amount !== undefined) {
    payload.amount = toNonNegativeNumber(patch.amount);
  }

  if (patch.frequency !== undefined) {
    payload.frequency = toFinanceFrequency(patch.frequency);
  }

  if (patch.category !== undefined) {
    payload.category = toCleanText(patch.category);
  }

  await setDoc(
    doc(firestore, "users", uid, "financeRecurringExpenses", id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteRecurringExpense(
  uid: string,
  id: string,
  monthKey?: string,
): Promise<void> {
  await deleteFinanceEntity({
    uid,
    entity: "recurringExpense",
    id,
    monthKey,
  });
}

export async function createDebt(
  uid: string,
  input: {
    name: string;
    currentBalance: number;
    interestRate?: number;
    minimumPayment?: number;
    dueDay?: number;
  },
): Promise<FinanceDebt> {
  const ref = doc(collection(firestore, "users", uid, "financeDebts"));

  const record = {
    name: toCleanText(input.name, "Debt"),
    currentBalance: toNonNegativeNumber(input.currentBalance),
    interestRate: toOptionalNumber(input.interestRate),
    minimumPayment: toOptionalNumber(input.minimumPayment),
    dueDay: toOptionalPositiveInt(input.dueDay),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, record, { merge: true });

  await syncLegacyMonthFromNewData(uid, toLocalYM(getLocalNow()), { syncDebts: true });

  return {
    id: ref.id,
    name: record.name,
    currentBalance: record.currentBalance,
    interestRate: record.interestRate,
    minimumPayment: record.minimumPayment,
    dueDay: record.dueDay,
  };
}

export async function updateDebt(
  uid: string,
  id: string,
  patch: Partial<FinanceDebt>,
): Promise<void> {
  const payload: EditableDebt = {};

  if (patch.name !== undefined) {
    payload.name = toCleanText(patch.name, "Debt");
  }

  if (patch.currentBalance !== undefined) {
    payload.currentBalance = toNonNegativeNumber(patch.currentBalance);
  }

  if (patch.interestRate !== undefined) {
    payload.interestRate = toOptionalNumber(patch.interestRate);
  }

  if (patch.minimumPayment !== undefined) {
    payload.minimumPayment = toOptionalNumber(patch.minimumPayment);
  }

  if (patch.dueDay !== undefined) {
    payload.dueDay = toOptionalPositiveInt(patch.dueDay);
  }

  await setDoc(
    doc(firestore, "users", uid, "financeDebts", id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await syncLegacyMonthFromNewData(uid, toLocalYM(getLocalNow()), { syncDebts: true });
}

export async function deleteDebt(uid: string, id: string, monthKey?: string): Promise<void> {
  await deleteFinanceEntity({
    uid,
    entity: "debt",
    id,
    monthKey,
  });
}

export async function createTransaction(
  uid: string,
  joinDateYmd: string,
  input: {
    type: FinanceTransactionType;
    amount: number;
    category?: string;
    note?: string;
    date?: string;
  },
): Promise<FinanceTransaction> {
  const ref = doc(collection(firestore, "users", uid, "financeTransactions"));
  const safeJoinYmd = toYmdOrFallback(joinDateYmd, toLocalYMD(getLocalNow()));
  const safeDate = clampDateToJoin(
    toYmdOrFallback(input.date, toLocalYMD(getLocalNow())),
    safeJoinYmd,
  );
  const type: FinanceTransactionType = input.type === "income" ? "income" : "expense";

  const record = {
    type,
    amount: toNonNegativeNumber(input.amount),
    category: toCleanText(input.category),
    note: toCleanText(input.note),
    date: safeDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, record, { merge: true });
  await syncLegacyMonthFromNewData(uid, safeDate.slice(0, 7), { syncTransactions: true });

  return {
    id: ref.id,
    type: record.type,
    amount: record.amount,
    category: record.category,
    note: record.note,
    date: record.date,
  };
}

export async function updateTransaction(
  uid: string,
  current: FinanceTransaction,
  patch: Partial<FinanceTransaction>,
  joinDateYmd: string,
): Promise<FinanceTransaction> {
  const safeJoinYmd = toYmdOrFallback(joinDateYmd, toLocalYMD(getLocalNow()));

  const next: FinanceTransaction = {
    ...current,
    ...patch,
    type: patch.type === "income" || patch.type === "expense" ? patch.type : current.type,
    amount:
      patch.amount === undefined
        ? current.amount
        : toNonNegativeNumber(patch.amount, current.amount),
    category:
      patch.category === undefined ? current.category : toCleanText(patch.category),
    note: patch.note === undefined ? current.note : toCleanText(patch.note),
    date:
      patch.date === undefined
        ? current.date
        : clampDateToJoin(toYmdOrFallback(patch.date, current.date), safeJoinYmd),
  };

  await setDoc(
    doc(firestore, "users", uid, "financeTransactions", current.id),
    {
      type: next.type,
      amount: next.amount,
      category: next.category,
      note: next.note,
      date: next.date,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const monthsToSync = uniqueStrings([current.date.slice(0, 7), next.date.slice(0, 7)]);

  await Promise.all(
    monthsToSync.map((monthKey) =>
      syncLegacyMonthFromNewData(uid, monthKey, { syncTransactions: true }),
    ),
  );

  return next;
}

export async function deleteTransaction(
  uid: string,
  idOrEntry: string | FinanceTransaction,
  options: DeleteTransactionOptions = {},
): Promise<void> {
  const id = typeof idOrEntry === "string" ? idOrEntry : idOrEntry.id;
  const monthKey =
    options.monthKey
    ?? (typeof idOrEntry === "string" ? undefined : idOrEntry.date.slice(0, 7));
  const transactionType =
    options.type
    ?? (typeof idOrEntry === "string" ? undefined : idOrEntry.type);

  await deleteFinanceEntity({
    uid,
    entity: "transaction",
    id,
    monthKey,
    transactionType,
  });
}
