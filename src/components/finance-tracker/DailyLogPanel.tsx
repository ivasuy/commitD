"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";

import { Button } from "@/src/components/ui/button";
import type {
  FinanceCategorySuggestions,
  FinanceTransaction,
  FinanceTransactionType,
} from "@/src/lib/finance/financeFacade";

interface DailyLogPanelProps {
  todayYmd: string;
  joinDateYmd: string;
  todayEntries: FinanceTransaction[];
  categorySuggestions: FinanceCategorySuggestions;
  onAddEntry: (input: {
    type: FinanceTransactionType;
    amount: number;
    category?: string;
    note?: string;
    date: string;
  }) => Promise<void> | void;
  onUpdateEntry: (
    entry: FinanceTransaction,
    patch: Partial<FinanceTransaction>,
  ) => Promise<void> | void;
  onDeleteEntry: (entry: FinanceTransaction) => Promise<void> | void;
  loading?: boolean;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function blurOnEnter(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  event.currentTarget.blur();
}

export default function DailyLogPanel({
  todayYmd,
  joinDateYmd,
  todayEntries,
  categorySuggestions,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading = false,
}: DailyLogPanelProps) {
  const [type, setType] = useState<FinanceTransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayYmd);

  const inputBase =
    "w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-white/20";
  const selectBase =
    "w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23ffffff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8";
  const actionButton =
    "rounded border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15";

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-3">
      <header className="mb-2">
        <h3 className="text-sm font-semibold text-white">Daily Log</h3>
        <p className="text-xs text-white/60">Quick add a transaction, then edit from today&apos;s list.</p>
      </header>

      <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/5 p-2 lg:grid-cols-12">
        <select
          value={type}
          onChange={(event) => setType(event.target.value as FinanceTransactionType)}
          className={`${selectBase} lg:col-span-2`}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          type="number"
          step="0.01"
          min={0}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={`${inputBase} lg:col-span-2`}
          placeholder="Amount"
        />

        <input
          list={type === "income" ? "daily-income-suggestions" : "daily-expense-suggestions"}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={`${inputBase} lg:col-span-2`}
          placeholder="Category (optional)"
        />

        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={`${inputBase} lg:col-span-3`}
          placeholder="Note (optional)"
        />

        <input
          type="date"
          min={joinDateYmd}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={`${inputBase} lg:col-span-2`}
          style={{ colorScheme: "dark" }}
        />

        <Button
          variant="glass-outline"
          className="h-9 lg:col-span-1"
          onClick={() => {
            const amountValue = toNumber(amount);

            if (amountValue <= 0) {
              return;
            }

            void onAddEntry({
              type,
              amount: amountValue,
              category: category.trim(),
              note: note.trim(),
              date,
            });

            setAmount("");
            setCategory("");
            setNote("");
            setDate(todayYmd);
            setType("expense");
          }}
        >
          Add
        </Button>
      </div>

      <datalist id="daily-income-suggestions">
        {categorySuggestions.income.map((entry) => (
          <option key={entry} value={entry} />
        ))}
      </datalist>

      <datalist id="daily-expense-suggestions">
        {categorySuggestions.expense.map((entry) => (
          <option key={entry} value={entry} />
        ))}
      </datalist>

      {/* Mobile Card View */}
      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto scrollbar-thin-dark lg:hidden">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
            Loading daily entries...
          </div>
        ) : todayEntries.length ? (
          todayEntries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${entry.type === "income" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                    {entry.type === "income" ? "Income" : "Expense"}
                  </span>
                  <span className="text-lg font-semibold text-white">${entry.amount.toFixed(2)}</span>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="lg:col-span-2"
                  onClick={() => void onDeleteEntry(entry)}
                >
                  Delete
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Type</label>
                  <select
                    defaultValue={entry.type}
                    className={selectBase}
                    onChange={(event) => {
                      const nextType = event.target.value as FinanceTransactionType;
                      if (nextType === entry.type) return;
                      void onUpdateEntry(entry, { type: nextType });
                    }}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
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
                      const amountValue = toNumber(event.currentTarget.value);
                      if (amountValue === entry.amount) return;
                      void onUpdateEntry(entry, { amount: amountValue });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Category</label>
                  <input
                    list={entry.type === "income" ? "daily-income-suggestions" : "daily-expense-suggestions"}
                    defaultValue={entry.category}
                    className={inputBase}
                    placeholder="Category"
                    onKeyDown={blurOnEnter}
                    onBlur={(event) => {
                      const nextCategory = event.currentTarget.value.trim();
                      if (nextCategory === entry.category) return;
                      void onUpdateEntry(entry, { category: nextCategory });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Date</label>
                  <input
                    type="date"
                    min={joinDateYmd}
                    defaultValue={entry.date}
                    className={inputBase}
                    style={{ colorScheme: "dark" }}
                    onKeyDown={blurOnEnter}
                    onBlur={(event) => {
                      const nextDate = event.currentTarget.value;
                      if (!nextDate || nextDate === entry.date) return;
                      void onUpdateEntry(entry, { date: nextDate });
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Note</label>
                <input
                  defaultValue={entry.note}
                  className={inputBase}
                  placeholder="Add a note..."
                  onKeyDown={blurOnEnter}
                  onBlur={(event) => {
                    const nextNote = event.currentTarget.value.trim();
                    if (nextNote === entry.note) return;
                    void onUpdateEntry(entry, { note: nextNote });
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
            No entries logged for today yet.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="mt-3 hidden h-80 overflow-hidden rounded-lg border border-white/10 bg-white/5 lg:block">
        <div className="h-full overflow-auto scrollbar-thin-dark">
          <table className="min-w-240 w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900/95 text-white/80 backdrop-blur">
              <tr>
                <th className="border border-white/10 px-2 py-1 text-left">Type</th>
                <th className="border border-white/10 px-2 py-1 text-right">Amount</th>
                <th className="border border-white/10 px-2 py-1 text-left">Category</th>
                <th className="border border-white/10 px-2 py-1 text-left">Note</th>
                <th className="border border-white/10 px-2 py-1 text-left">Date</th>
                <th className="border border-white/10 px-2 py-1" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="border border-white/10 px-2 py-8 text-center text-white/60">
                    Loading daily entries...
                  </td>
                </tr>
              ) : todayEntries.length ? (
                todayEntries.map((entry) => {
                  return (
                    <tr key={entry.id} className="hover:bg-white/5">
                      <td className="border border-white/10 px-2 py-1">
                        <select
                          defaultValue={entry.type}
                          className={selectBase}
                          onChange={(event) => {
                            const nextType = event.target.value as FinanceTransactionType;

                            if (nextType === entry.type) {
                              return;
                            }

                            void onUpdateEntry(entry, { type: nextType });
                          }}
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </td>

                      <td className="border border-white/10 px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={entry.amount}
                          className={`${inputBase} text-right`}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const amountValue = toNumber(event.currentTarget.value);

                            if (amountValue === entry.amount) {
                              return;
                            }

                            void onUpdateEntry(entry, { amount: amountValue });
                          }}
                        />
                      </td>

                      <td className="border border-white/10 px-2 py-1">
                        <input
                          list={entry.type === "income" ? "daily-income-suggestions" : "daily-expense-suggestions"}
                          defaultValue={entry.category}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const nextCategory = event.currentTarget.value.trim();

                            if (nextCategory === entry.category) {
                              return;
                            }

                            void onUpdateEntry(entry, { category: nextCategory });
                          }}
                        />
                      </td>

                      <td className="border border-white/10 px-2 py-1">
                        <input
                          defaultValue={entry.note}
                          className={inputBase}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const nextNote = event.currentTarget.value.trim();

                            if (nextNote === entry.note) {
                              return;
                            }

                            void onUpdateEntry(entry, { note: nextNote });
                          }}
                        />
                      </td>

                      <td className="border border-white/10 px-2 py-1">
                        <input
                          type="date"
                          min={joinDateYmd}
                          defaultValue={entry.date}
                          className={inputBase}
                          style={{ colorScheme: "dark" }}
                          onKeyDown={blurOnEnter}
                          onBlur={(event) => {
                            const nextDate = event.currentTarget.value;

                            if (!nextDate || nextDate === entry.date) {
                              return;
                            }

                            void onUpdateEntry(entry, { date: nextDate });
                          }}
                        />
                      </td>

                      <td className="border border-white/10 px-2 py-1 text-center">
                        <Button
                          type="button"
                          variant="destructive"
                          className="lg:col-span-2"
                          onClick={() => void onDeleteEntry(entry)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="border border-white/10 px-2 py-8 text-center text-white/60">
                    No entries logged for today yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
