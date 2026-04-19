"use client";

import { cn } from "@/src/lib/cn";

interface IncomeExpenseBarProps {
  income: number;
  expenses: number;
  className?: string;
}

export default function IncomeExpenseBar({
  income,
  expenses,
  className,
}: IncomeExpenseBarProps) {
  const max = Math.max(income, expenses, 1);
  const incomeW = (income / max) * 100;
  const expensesW = (expenses / max) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-l-full bg-emerald-500/70 transition-all duration-500"
          style={{ width: `${incomeW}%` }}
        />
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-l-full bg-rose-500/70 transition-all duration-500"
          style={{ width: `${expensesW}%` }}
        />
      </div>
    </div>
  );
}
