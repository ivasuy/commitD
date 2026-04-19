"use client";

import { useEffect, useMemo, useState } from "react";

import PageShell from "@/src/components/layout/PageShell";
import SectionCard from "@/src/components/layout/SectionCard";
import DailyLogPanel from "@/src/components/finance-tracker/DailyLogPanel";
import OverviewStrip from "@/src/components/finance-tracker/OverviewStrip";
import SetupAccordion from "@/src/components/finance-tracker/SetupAccordion";
import { useAuth } from "@/src/hooks/useAuth";
import { useLocalToday } from "@/src/hooks/useLocalToday";
import { getMonthLabel } from "@/src/lib/finance-tracker/date";
import {
  calculateMonthlyOverview,
  createDebt,
  createIncomeStream,
  createRecurringExpense,
  createTransaction,
  deleteDebt,
  deleteIncomeStream,
  deleteRecurringExpense,
  deleteTransaction,
  loadFinanceSnapshot,
  type FinanceCategorySuggestions,
  type FinanceDebt,
  type FinanceFrequency,
  type FinanceIncomeStream,
  type FinanceRecurringExpense,
  type FinanceTransaction,
  type FinanceTransactionType,
  updateDebt,
  updateIncomeStream,
  updateRecurringExpense,
  updateTransaction,
} from "@/src/lib/finance/financeFacade";
import { getJoinDate, toYmd } from "@/src/lib/date/joinWindow";
import { loadUserProfile } from "@/src/lib/db/profile";

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

function uniqueText(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(trimmed);
  });

  return output;
}

export default function FinanceTrackerPage() {
  const { user } = useAuth();
  const { monthKeyYm, todayYmd } = useLocalToday();

  const [joinDateYmd, setJoinDateYmd] = useState(todayYmd);
  const [incomeStreams, setIncomeStreams] = useState<FinanceIncomeStream[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<FinanceRecurringExpense[]>([]);
  const [debts, setDebts] = useState<FinanceDebt[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [baseSuggestions, setBaseSuggestions] = useState<FinanceCategorySuggestions>({
    income: [],
    expense: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadJoinDate = async () => {
      try {
        const profile = await loadUserProfile(user.uid);

        if (!active) {
          return;
        }

        setJoinDateYmd(toYmd(getJoinDate(profile)));
      } catch {
        if (active) {
          setJoinDateYmd(todayYmd);
        }
      }
    };

    void loadJoinDate();

    return () => {
      active = false;
    };
  }, [user, todayYmd]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const snapshot = await loadFinanceSnapshot(user.uid, monthKeyYm);

        if (!active) {
          return;
        }

        setIncomeStreams(snapshot.incomeStreams);
        setRecurringExpenses(snapshot.recurringExpenses);
        setDebts(snapshot.debts);
        setTransactions(snapshot.transactions);
        setBaseSuggestions(snapshot.categorySuggestions);
      } catch {
        if (active) {
          setError("Could not load finance data. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user, monthKeyYm]);

  const categorySuggestions = useMemo<FinanceCategorySuggestions>(
    () => ({
      income: uniqueText([
        ...baseSuggestions.income,
        ...incomeStreams.map((entry) => entry.name),
        ...transactions
          .filter((entry) => entry.type === "income")
          .map((entry) => entry.category),
      ]),
      expense: uniqueText([
        ...baseSuggestions.expense,
        ...recurringExpenses.flatMap((entry) => [entry.name, entry.category]),
        ...transactions
          .filter((entry) => entry.type === "expense")
          .map((entry) => entry.category),
      ]),
    }),
    [baseSuggestions, incomeStreams, recurringExpenses, transactions],
  );

  const todayEntries = useMemo(
    () =>
      sortTransactions(
        transactions.filter((entry) => entry.date === todayYmd),
      ),
    [transactions, todayYmd],
  );

  const overview = useMemo(
    () =>
      calculateMonthlyOverview({
        monthKey: monthKeyYm,
        incomeStreams,
        recurringExpenses,
        debts,
        transactions,
      }),
    [monthKeyYm, incomeStreams, recurringExpenses, debts, transactions],
  );

  const handleAddIncomeStream = async (input: {
    name: string;
    amount: number;
    frequency: FinanceFrequency;
  }) => {
    if (!user) {
      return;
    }

    try {
      const created = await createIncomeStream(user.uid, input);
      setIncomeStreams((previous) => sortByName([...previous, created]));
    } catch {
      setError("Could not add income stream.");
    }
  };

  const handleUpdateIncomeStream = async (
    id: string,
    patch: Partial<FinanceIncomeStream>,
  ) => {
    if (!user) {
      return;
    }

    const next = incomeStreams.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
    setIncomeStreams(sortByName(next));

    try {
      await updateIncomeStream(user.uid, id, patch);
    } catch {
      setError("Could not save income stream changes.");
    }
  };

  const handleDeleteIncomeStream = async (id: string) => {
    if (!user) {
      return;
    }

    const previous = incomeStreams;
    setIncomeStreams((current) => current.filter((entry) => entry.id !== id));

    try {
      await deleteIncomeStream(user.uid, id, monthKeyYm);
    } catch {
      setIncomeStreams(previous);
      setError("Could not delete income stream.");
    }
  };

  const handleAddRecurringExpense = async (input: {
    name: string;
    amount: number;
    frequency: FinanceFrequency;
    category?: string;
  }) => {
    if (!user) {
      return;
    }

    try {
      const created = await createRecurringExpense(user.uid, input);
      setRecurringExpenses((previous) => sortByName([...previous, created]));
    } catch {
      setError("Could not add recurring expense.");
    }
  };

  const handleUpdateRecurringExpense = async (
    id: string,
    patch: Partial<FinanceRecurringExpense>,
  ) => {
    if (!user) {
      return;
    }

    const next = recurringExpenses.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            ...patch,
          }
        : entry,
    );

    setRecurringExpenses(sortByName(next));

    try {
      await updateRecurringExpense(user.uid, id, patch);
    } catch {
      setError("Could not save recurring expense changes.");
    }
  };

  const handleDeleteRecurringExpense = async (id: string) => {
    if (!user) {
      return;
    }

    const previous = recurringExpenses;
    setRecurringExpenses((current) => current.filter((entry) => entry.id !== id));

    try {
      await deleteRecurringExpense(user.uid, id, monthKeyYm);
    } catch {
      setRecurringExpenses(previous);
      setError("Could not delete recurring expense.");
    }
  };

  const handleAddDebt = async (input: {
    name: string;
    currentBalance: number;
    interestRate?: number;
    minimumPayment?: number;
    dueDay?: number;
  }) => {
    if (!user) {
      return;
    }

    try {
      const created = await createDebt(user.uid, input);
      setDebts((previous) => sortByName([...previous, created]));
    } catch {
      setError("Could not add debt.");
    }
  };

  const handleUpdateDebt = async (id: string, patch: Partial<FinanceDebt>) => {
    if (!user) {
      return;
    }

    const next = debts.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
    setDebts(sortByName(next));

    try {
      await updateDebt(user.uid, id, patch);
    } catch {
      setError("Could not save debt changes.");
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!user) {
      return;
    }

    const previous = debts;
    setDebts((current) => current.filter((entry) => entry.id !== id));

    try {
      await deleteDebt(user.uid, id, monthKeyYm);
    } catch {
      setDebts(previous);
      setError("Could not delete debt.");
    }
  };

  const handleAddTransaction = async (input: {
    type: FinanceTransactionType;
    amount: number;
    category?: string;
    note?: string;
    date: string;
  }) => {
    if (!user) {
      return;
    }

    try {
      const created = await createTransaction(user.uid, joinDateYmd, input);

      if (created.date.startsWith(`${monthKeyYm}-`)) {
        setTransactions((previous) => sortTransactions([...previous, created]));
      }
    } catch {
      setError("Could not add transaction.");
    }
  };

  const handleUpdateTransaction = async (
    entry: FinanceTransaction,
    patch: Partial<FinanceTransaction>,
  ) => {
    if (!user) {
      return;
    }

    try {
      const updated = await updateTransaction(user.uid, entry, patch, joinDateYmd);

      setTransactions((previous) => {
        const withoutCurrent = previous.filter((item) => item.id !== entry.id);

        if (!updated.date.startsWith(`${monthKeyYm}-`)) {
          return withoutCurrent;
        }

        return sortTransactions([...withoutCurrent, updated]);
      });
    } catch {
      setError("Could not save transaction changes.");
    }
  };

  const handleDeleteTransaction = async (entry: FinanceTransaction) => {
    if (!user) {
      return;
    }

    const previous = transactions;
    setTransactions((current) => current.filter((item) => item.id !== entry.id));

    try {
      await deleteTransaction(user.uid, entry.id, {
        monthKey: entry.date.slice(0, 7),
        type: entry.type,
      });
    } catch {
      setTransactions(previous);
      setError("Could not delete transaction.");
    }
  };

  return (
    <PageShell
      title="Finance Tracker"
      subtitle="Set recurring finances once, log daily activity fast, and track this month in one view."
    >
      {error ? (
        <SectionCard>
          <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Simple Overview">
        <OverviewStrip
          monthLabel={getMonthLabel(monthKeyYm)}
          totals={overview}
          loading={loading}
        />
      </SectionCard>

      <SectionCard title="Daily Log">
        <p className="mb-2 text-xs text-white/60">
          Date cannot be earlier than your join date: {joinDateYmd}
        </p>

        <DailyLogPanel
          todayYmd={todayYmd}
          joinDateYmd={joinDateYmd}
          todayEntries={todayEntries}
          categorySuggestions={categorySuggestions}
          onAddEntry={handleAddTransaction}
          onUpdateEntry={handleUpdateTransaction}
          onDeleteEntry={handleDeleteTransaction}
          loading={loading}
        />
      </SectionCard>

      <SectionCard title="Setup">
        <SetupAccordion
          incomeStreams={incomeStreams}
          recurringExpenses={recurringExpenses}
          debts={debts}
          expenseCategorySuggestions={categorySuggestions.expense}
          onAddIncomeStream={handleAddIncomeStream}
          onUpdateIncomeStream={handleUpdateIncomeStream}
          onDeleteIncomeStream={handleDeleteIncomeStream}
          onAddRecurringExpense={handleAddRecurringExpense}
          onUpdateRecurringExpense={handleUpdateRecurringExpense}
          onDeleteRecurringExpense={handleDeleteRecurringExpense}
          onAddDebt={handleAddDebt}
          onUpdateDebt={handleUpdateDebt}
          onDeleteDebt={handleDeleteDebt}
          loading={loading}
        />
      </SectionCard>
    </PageShell>
  );
}
