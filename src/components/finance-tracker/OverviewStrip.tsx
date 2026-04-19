import type { FinanceOverviewTotals } from "@/src/lib/finance/financeFacade";

interface OverviewStripProps {
  monthLabel: string;
  totals: FinanceOverviewTotals;
  loading?: boolean;
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <header className="border-b border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/65">
        {title}
      </header>
      <p className="px-3 py-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export default function OverviewStrip({ monthLabel, totals, loading = false }: OverviewStripProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-6 text-sm text-white/70">
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{monthLabel}</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="This Month Income" value={formatNumber(totals.monthIncome)} />
        <StatCard title="This Month Expenses" value={formatNumber(totals.monthExpenses)} />
        <StatCard title="Net" value={formatNumber(totals.net)} />
        <StatCard title="Debt Total" value={formatNumber(totals.debtTotal)} />
      </div>
    </div>
  );
}
