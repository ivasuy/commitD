"use client";

import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { Button } from "@/src/components/ui/button";
import type {
  FinanceDebt,
  FinanceFrequency,
  FinanceIncomeStream,
  FinanceRecurringExpense,
} from "@/src/lib/finance/financeFacade";

type PanelKey = "income" | "expenses" | "debts";

interface SetupAccordionProps {
  incomeStreams: FinanceIncomeStream[];
  recurringExpenses: FinanceRecurringExpense[];
  debts: FinanceDebt[];
  expenseCategorySuggestions: string[];
  onAddIncomeStream: (input: {
    name: string;
    amount: number;
    frequency: FinanceFrequency;
  }) => Promise<void> | void;
  onUpdateIncomeStream: (
    id: string,
    patch: Partial<FinanceIncomeStream>,
  ) => Promise<void> | void;
  onDeleteIncomeStream: (id: string) => Promise<void> | void;
  onAddRecurringExpense: (input: {
    name: string;
    amount: number;
    frequency: FinanceFrequency;
    category?: string;
  }) => Promise<void> | void;
  onUpdateRecurringExpense: (
    id: string,
    patch: Partial<FinanceRecurringExpense>,
  ) => Promise<void> | void;
  onDeleteRecurringExpense: (id: string) => Promise<void> | void;
  onAddDebt: (input: {
    name: string;
    currentBalance: number;
    interestRate?: number;
    minimumPayment?: number;
    dueDay?: number;
  }) => Promise<void> | void;
  onUpdateDebt: (id: string, patch: Partial<FinanceDebt>) => Promise<void> | void;
  onDeleteDebt: (id: string) => Promise<void> | void;
  loading?: boolean;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalDueDay(value: string): number | undefined {
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

function blurOnEnter(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  event.currentTarget.blur();
}

function Panel({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-left"
      >
        <span>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/60">{subtitle}</p>
        </span>
        <span className="text-xs text-white/70">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen ? <div className="p-3">{children}</div> : null}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-2 py-6 text-center text-sm text-white/60">{text}</p>;
}

export default function SetupAccordion({
  incomeStreams,
  recurringExpenses,
  debts,
  expenseCategorySuggestions,
  onAddIncomeStream,
  onUpdateIncomeStream,
  onDeleteIncomeStream,
  onAddRecurringExpense,
  onUpdateRecurringExpense,
  onDeleteRecurringExpense,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  loading = false,
}: SetupAccordionProps) {
  const [openPanel, setOpenPanel] = useState<PanelKey>("income");

  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("0");
  const [incomeFrequency, setIncomeFrequency] = useState<FinanceFrequency>("monthly");

  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("0");
  const [expenseFrequency, setExpenseFrequency] = useState<FinanceFrequency>("monthly");
  const [expenseCategory, setExpenseCategory] = useState("");

  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("0");
  const [debtRate, setDebtRate] = useState("");
  const [debtMinimum, setDebtMinimum] = useState("");
  const [debtDueDay, setDebtDueDay] = useState("");

  const inputBase =
    "w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-white/20";
  const selectBase =
    "w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23ffffff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8";
  const rowGrid = "grid grid-cols-1 gap-2 border-b border-white/10 px-2 py-2 lg:grid-cols-12";
  const actionButton =
    "rounded border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15";

  const renderLoading = () => (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-8 text-center text-sm text-white/60">
      Loading setup...
    </div>
  );

  return (
    <div className="space-y-3">
      <Panel
        title="Income Streams"
        subtitle="Set recurring income once."
        isOpen={openPanel === "income"}
        onToggle={() => setOpenPanel("income")}
      >
        {loading ? (
          renderLoading()
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/5 p-2 lg:grid-cols-12">
              <input
                placeholder="Name (e.g. Salary)"
                value={incomeName}
                onChange={(event) => setIncomeName(event.target.value)}
                className={`${inputBase} lg:col-span-5`}
              />
              <input
                type="number"
                step="0.01"
                min={0}
                value={incomeAmount}
                onChange={(event) => setIncomeAmount(event.target.value)}
                className={`${inputBase} lg:col-span-3`}
                placeholder="Amount"
              />
              <select
                value={incomeFrequency}
                onChange={(event) => setIncomeFrequency(event.target.value as FinanceFrequency)}
                className={`${selectBase} lg:col-span-2`}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <Button
                variant="glass-outline"
                className="h-9 lg:col-span-2"
                onClick={() => {
                  const name = incomeName.trim();

                  if (!name) {
                    return;
                  }

                  void onAddIncomeStream({
                    name,
                    amount: toNumber(incomeAmount),
                    frequency: incomeFrequency,
                  });

                  setIncomeName("");
                  setIncomeAmount("0");
                  setIncomeFrequency("monthly");
                }}
              >
                Add
              </Button>
            </div>

            {/* Mobile Card View */}
            <div className="mt-2 max-h-64 space-y-3 overflow-y-auto scrollbar-thin-dark lg:hidden">
              {incomeStreams.length ? (
                incomeStreams.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{entry.name}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        className="lg:col-span-2"
                        onClick={() => void onDeleteIncomeStream(entry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Name</label>
                      <input
                        defaultValue={entry.name}
                        className={inputBase}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const name = event.currentTarget.value.trim();
                          if (!name || name === entry.name) {
                            event.currentTarget.value = entry.name;
                            return;
                          }
                          void onUpdateIncomeStream(entry.id, { name });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={entry.amount}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const amount = toNumber(event.currentTarget.value);
                            if (amount === entry.amount) return;
                            void onUpdateIncomeStream(entry.id, { amount });
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Frequency</label>
                        <select
                          defaultValue={entry.frequency}
                          className={selectBase}
                          onChange={(event) => {
                            const frequency = event.target.value as FinanceFrequency;
                            if (frequency === entry.frequency) return;
                            void onUpdateIncomeStream(entry.id, { frequency });
                          }}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Biweekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No income streams yet. Add your first recurring income." />
              )}
            </div>

            {/* Desktop Table View */}
            <div className="mt-2 hidden h-64 overflow-hidden rounded-lg border border-white/10 bg-white/5 lg:block">
              <div className="h-full overflow-y-auto scrollbar-thin-dark">
                {incomeStreams.length ? (
                  incomeStreams.map((entry) => (
                    <div key={entry.id} className={rowGrid}>
                      <input
                        defaultValue={entry.name}
                        className={`${inputBase} lg:col-span-5`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const name = event.currentTarget.value.trim();

                          if (!name || name === entry.name) {
                            event.currentTarget.value = entry.name;
                            return;
                          }

                          void onUpdateIncomeStream(entry.id, { name });
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={entry.amount}
                        className={`${inputBase} lg:col-span-3`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const amount = toNumber(event.currentTarget.value);

                          if (amount === entry.amount) {
                            return;
                          }

                          void onUpdateIncomeStream(entry.id, { amount });
                        }}
                      />
                      <select
                        defaultValue={entry.frequency}
                        className={`${selectBase} lg:col-span-2`}
                        onChange={(event) => {
                          const frequency = event.target.value as FinanceFrequency;

                          if (frequency === entry.frequency) {
                            return;
                          }

                          void onUpdateIncomeStream(entry.id, { frequency });
                        }}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <Button
                        type="button"
                        variant="destructive"
                        className="lg:col-span-2"
                        onClick={() => void onDeleteIncomeStream(entry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No income streams yet. Add your first recurring income." />
                )}
              </div>
            </div>
          </>
        )}
      </Panel>

      <Panel
        title="Recurring Expenses"
        subtitle="Track subscriptions and monthly bills."
        isOpen={openPanel === "expenses"}
        onToggle={() => setOpenPanel("expenses")}
      >
        {loading ? (
          renderLoading()
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/5 p-2 lg:grid-cols-12">
              <input
                placeholder="Name (e.g. Rent)"
                value={expenseName}
                onChange={(event) => setExpenseName(event.target.value)}
                className={`${inputBase} lg:col-span-4`}
              />
              <input
                type="number"
                step="0.01"
                min={0}
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                className={`${inputBase} lg:col-span-2`}
                placeholder="Amount"
              />
              <select
                value={expenseFrequency}
                onChange={(event) => setExpenseFrequency(event.target.value as FinanceFrequency)}
                className={`${selectBase} lg:col-span-2`}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                list="setup-expense-categories"
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
                placeholder="Category (optional)"
                className={`${inputBase} lg:col-span-2`}
              />
              <Button
                variant="glass-outline"
                className="h-9 lg:col-span-2"
                onClick={() => {
                  const name = expenseName.trim();

                  if (!name) {
                    return;
                  }

                  void onAddRecurringExpense({
                    name,
                    amount: toNumber(expenseAmount),
                    frequency: expenseFrequency,
                    category: expenseCategory.trim(),
                  });

                  setExpenseName("");
                  setExpenseAmount("0");
                  setExpenseFrequency("monthly");
                  setExpenseCategory("");
                }}
              >
                Add
              </Button>
            </div>

            <datalist id="setup-expense-categories">
              {expenseCategorySuggestions.map((entry) => (
                <option key={entry} value={entry} />
              ))}
            </datalist>

            {/* Mobile Card View */}
            <div className="mt-2 max-h-64 space-y-3 overflow-y-auto scrollbar-thin-dark lg:hidden">
              {recurringExpenses.length ? (
                recurringExpenses.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-white">{entry.name}</span>
                        <span className="ml-2 text-sm text-white/70">${entry.amount.toFixed(2)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        className="lg:col-span-2"
                        onClick={() => void onDeleteRecurringExpense(entry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Name</label>
                        <input
                          defaultValue={entry.name}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const name = event.currentTarget.value.trim();
                            if (!name || name === entry.name) {
                              event.currentTarget.value = entry.name;
                              return;
                            }
                            void onUpdateRecurringExpense(entry.id, { name });
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={entry.amount}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const amount = toNumber(event.currentTarget.value);
                            if (amount === entry.amount) return;
                            void onUpdateRecurringExpense(entry.id, { amount });
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Frequency</label>
                        <select
                          defaultValue={entry.frequency}
                          className={selectBase}
                          onChange={(event) => {
                            const frequency = event.target.value as FinanceFrequency;
                            if (frequency === entry.frequency) return;
                            void onUpdateRecurringExpense(entry.id, { frequency });
                          }}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Biweekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Category</label>
                        <input
                          list="setup-expense-categories"
                          defaultValue={entry.category}
                          className={inputBase}
                          placeholder="Category"
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const category = event.currentTarget.value.trim();
                            if (category === entry.category) return;
                            void onUpdateRecurringExpense(entry.id, { category });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No recurring expenses yet. Add subscriptions or bills." />
              )}
            </div>

            {/* Desktop Table View */}
            <div className="mt-2 hidden h-64 overflow-hidden rounded-lg border border-white/10 bg-white/5 lg:block">
              <div className="h-full overflow-y-auto scrollbar-thin-dark">
                {recurringExpenses.length ? (
                  recurringExpenses.map((entry) => (
                    <div key={entry.id} className={rowGrid}>
                      <input
                        defaultValue={entry.name}
                        className={`${inputBase} lg:col-span-4`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const name = event.currentTarget.value.trim();

                          if (!name || name === entry.name) {
                            event.currentTarget.value = entry.name;
                            return;
                          }

                          void onUpdateRecurringExpense(entry.id, { name });
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={entry.amount}
                        className={`${inputBase} lg:col-span-2`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const amount = toNumber(event.currentTarget.value);

                          if (amount === entry.amount) {
                            return;
                          }

                          void onUpdateRecurringExpense(entry.id, { amount });
                        }}
                      />
                      <select
                        defaultValue={entry.frequency}
                        className={`${selectBase} lg:col-span-2`}
                        onChange={(event) => {
                          const frequency = event.target.value as FinanceFrequency;

                          if (frequency === entry.frequency) {
                            return;
                          }

                          void onUpdateRecurringExpense(entry.id, { frequency });
                        }}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <input
                        list="setup-expense-categories"
                        defaultValue={entry.category}
                        className={`${inputBase} lg:col-span-2`}
                        placeholder="Category"
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const category = event.currentTarget.value.trim();

                          if (category === entry.category) {
                            return;
                          }

                          void onUpdateRecurringExpense(entry.id, { category });
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        className="lg:col-span-2"
                        onClick={() => void onDeleteRecurringExpense(entry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No recurring expenses yet. Add subscriptions or bills." />
                )}
              </div>
            </div>
          </>
        )}
      </Panel>

      <Panel
        title="Debts"
        subtitle="Keep current balances and payment details in one place."
        isOpen={openPanel === "debts"}
        onToggle={() => setOpenPanel("debts")}
      >
        {loading ? (
          renderLoading()
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/5 p-2 lg:grid-cols-12">
              <input
                placeholder="Name"
                value={debtName}
                onChange={(event) => setDebtName(event.target.value)}
                className={`${inputBase} lg:col-span-3`}
              />
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Current balance"
                value={debtBalance}
                onChange={(event) => setDebtBalance(event.target.value)}
                className={`${inputBase} lg:col-span-2`}
              />
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Interest %"
                value={debtRate}
                onChange={(event) => setDebtRate(event.target.value)}
                className={`${inputBase} lg:col-span-2`}
              />
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Minimum payment"
                value={debtMinimum}
                onChange={(event) => setDebtMinimum(event.target.value)}
                className={`${inputBase} lg:col-span-2`}
              />
              <input
                type="number"
                min={1}
                max={31}
                placeholder="Due day"
                value={debtDueDay}
                onChange={(event) => setDebtDueDay(event.target.value)}
                className={`${inputBase} lg:col-span-1`}
              />
              <Button
                variant="glass-outline"
                className="h-9 lg:col-span-2"
                onClick={() => {
                  const name = debtName.trim();

                  if (!name) {
                    return;
                  }

                  void onAddDebt({
                    name,
                    currentBalance: toNumber(debtBalance),
                    interestRate: toOptionalNumber(debtRate),
                    minimumPayment: toOptionalNumber(debtMinimum),
                    dueDay: toOptionalDueDay(debtDueDay),
                  });

                  setDebtName("");
                  setDebtBalance("0");
                  setDebtRate("");
                  setDebtMinimum("");
                  setDebtDueDay("");
                }}
              >
                Add
              </Button>
            </div>

            {/* Mobile Card View */}
            <div className="mt-2 max-h-64 space-y-3 overflow-y-auto scrollbar-thin-dark lg:hidden">
              {debts.length ? (
                debts.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-white">{entry.name}</span>
                        <span className="ml-2 text-sm text-white/70">${entry.currentBalance.toFixed(2)}</span>
                      </div>
                      <Button
                        type="button"   
                        variant="destructive"
                        className="lg:col-span-2"
                        onClick={() => void onDeleteDebt(entry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Name</label>
                        <input
                          defaultValue={entry.name}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const name = event.currentTarget.value.trim();
                            if (!name || name === entry.name) {
                              event.currentTarget.value = entry.name;
                              return;
                            }
                            void onUpdateDebt(entry.id, { name });
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Balance</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={entry.currentBalance}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const currentBalance = toNumber(event.currentTarget.value);
                            if (currentBalance === entry.currentBalance) return;
                            void onUpdateDebt(entry.id, { currentBalance });
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Interest %</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={entry.interestRate ?? ""}
                          placeholder="-"
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const interestRate = toOptionalNumber(event.currentTarget.value);
                            if (interestRate === entry.interestRate) return;
                            void onUpdateDebt(entry.id, { interestRate });
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Min Payment</label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={entry.minimumPayment ?? ""}
                          placeholder="-"
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const minimumPayment = toOptionalNumber(event.currentTarget.value);
                            if (minimumPayment === entry.minimumPayment) return;
                            void onUpdateDebt(entry.id, { minimumPayment });
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Due Day</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          defaultValue={entry.dueDay ?? ""}
                          placeholder="-"
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const dueDay = toOptionalDueDay(event.currentTarget.value);
                            if (dueDay === entry.dueDay) return;
                            void onUpdateDebt(entry.id, { dueDay });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No debts yet. Add loans or credit cards here." />
              )}
            </div>

            {/* Desktop Table View */}
            <div className="mt-2 hidden h-64 overflow-hidden rounded-lg border border-white/10 bg-white/5 lg:block">
              <div className="h-full overflow-y-auto scrollbar-thin-dark">
                {debts.length ? (
                  debts.map((entry) => (
                    <div key={entry.id} className={rowGrid}>
                      <input
                        defaultValue={entry.name}
                        className={`${inputBase} lg:col-span-3`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const name = event.currentTarget.value.trim();

                          if (!name || name === entry.name) {
                            event.currentTarget.value = entry.name;
                            return;
                          }

                          void onUpdateDebt(entry.id, { name });
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={entry.currentBalance}
                        className={`${inputBase} lg:col-span-2`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const currentBalance = toNumber(event.currentTarget.value);

                          if (currentBalance === entry.currentBalance) {
                            return;
                          }

                          void onUpdateDebt(entry.id, { currentBalance });
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={entry.interestRate ?? ""}
                        placeholder="Interest %"
                        className={`${inputBase} lg:col-span-2`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const interestRate = toOptionalNumber(event.currentTarget.value);

                          if (interestRate === entry.interestRate) {
                            return;
                          }

                          void onUpdateDebt(entry.id, { interestRate });
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        defaultValue={entry.minimumPayment ?? ""}
                        placeholder="Minimum"
                        className={`${inputBase} lg:col-span-2`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const minimumPayment = toOptionalNumber(event.currentTarget.value);

                          if (minimumPayment === entry.minimumPayment) {
                            return;
                          }

                          void onUpdateDebt(entry.id, { minimumPayment });
                        }}
                      />
                      <input
                        type="number"
                        min={1}
                        max={31}
                        defaultValue={entry.dueDay ?? ""}
                        placeholder="Due day"
                        className={`${inputBase} lg:col-span-1`}
                        onKeyDown={blurOnEnter}
                        onBlur={(event) => {
                          const dueDay = toOptionalDueDay(event.currentTarget.value);

                          if (dueDay === entry.dueDay) {
                            return;
                          }

                          void onUpdateDebt(entry.id, { dueDay });
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        className="lg:col-span-2"
                        onClick={() => void onDeleteDebt(entry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No debts yet. Add loans or credit cards here." />
                )}
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
