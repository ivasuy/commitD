"use client";

import { useMemo } from "react";

import type { DistributionSlice } from "@/src/lib/task-tracker/types";

interface TaskDistributionProps {
  title: string;
  slices: DistributionSlice[];
  totalTasks: number;
  emptyMessage?: string;
}

interface DistributionRow extends DistributionSlice {
  percent: number;
}

function toPercent(count: number, total: number): number {
  if (!total || count <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (count / total) * 100));
}

export default function TaskDistribution({
  title,
  slices,
  totalTasks,
  emptyMessage = "No tasks yet",
}: TaskDistributionProps) {
  const rows = useMemo<DistributionRow[]>(
    () =>
      slices.map((slice) => ({
        ...slice,
        percent: toPercent(slice.count, totalTasks),
      })),
    [slices, totalTasks],
  );

  return (
    <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-3 sm:p-4">
      <header className="mb-3 text-center text-sm font-semibold text-white/90">{title}</header>

      {totalTasks > 0 ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="min-w-0">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 wrap-break-word text-sm font-medium leading-tight text-white/85">
                  {row.label}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-white/70">
                  {`${row.count} (${Math.round(row.percent)}%)`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${row.percent}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[240px] items-center justify-center rounded-xl border border-white/10 bg-white/3 text-sm text-white/60">
          {emptyMessage}
        </div>
      )}

      <footer className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-white/60">
        {totalTasks.toLocaleString("en-US")} total tasks
      </footer>
    </div>
  );
}
