"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListChecks, TrendingUp } from "lucide-react";

import MonthlyProgressChart from "@/src/components/habit-tracker/MonthlyProgressChart";
import AreaChart from "@/src/components/habit-tracker/charts/AreaChart";
import MiniDonut from "@/src/components/dashboard/charts/MiniDonut";
import SectionCard from "@/src/components/layout/SectionCard";
import { useLocalToday } from "@/src/hooks/useLocalToday";
import {
  loadHabitMonth,
  loadHabitTrackerMeta,
  readCachedHabitMonth,
  type HabitTrackerMeta,
} from "@/src/lib/db/store";
import { fromYearMonthKey, getDaysInMonth, toYearMonthKey } from "@/src/lib/date";
import { getFirstEntryDate } from "@/src/lib/date/firstEntryWindow";
import {
  calculateMonthMetrics,
  calculateYearlyStatistics,
} from "@/src/lib/habit-tracker/metrics";
import { loadYearStatisticsCache } from "@/src/lib/habit-tracker/storage";
import type { HabitMonthState, YearlyMonthStatistic } from "@/src/lib/habit-tracker/types";
import { listStorageKeys } from "@/src/lib/storage";
import { parseLocalYMD } from "@/src/lib/time/localTime";

interface HabitTrackerInsightsWidgetProps {
  uid: string | null;
}

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

const monthOptionFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayIndexInMonth(date: Date): number {
  return Math.max(0, date.getDate() - 1);
}

function createEmptyMonthState(daysInMonth: number): HabitMonthState {
  return {
    habits: [],
    checksByHabitId: {},
    mood: Array.from({ length: daysInMonth }, () => 0),
    motivation: Array.from({ length: daysInMonth }, () => 0),
  };
}

function resolveWindowStartDate(meta: HabitTrackerMeta | null): Date | null {
  if (!meta) {
    return null;
  }

  const firstEntryDate = getFirstEntryDate(meta);

  if (firstEntryDate) {
    return startOfDay(firstEntryDate);
  }

  if (meta.firstWeekStart) {
    const parsed = parseLocalYMD(meta.firstWeekStart);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfDay(parsed);
    }
  }

  if (meta.firstMonthKey) {
    const parsed = fromYearMonthKey(meta.firstMonthKey);

    if (parsed) {
      return startOfDay(new Date(parsed.year, parsed.monthIndex, 1));
    }
  }

  return null;
}

function monthSortValue(monthKey: string): number {
  const parsed = fromYearMonthKey(monthKey);

  if (!parsed) {
    return 0;
  }

  return parsed.year * 12 + parsed.monthIndex;
}

function formatMonthLabel(monthKey: string): string {
  const parsed = fromYearMonthKey(monthKey);

  if (!parsed) {
    return monthKey;
  }

  return monthOptionFormatter.format(new Date(parsed.year, parsed.monthIndex, 1));
}

function shortLabel(monthName: string): string {
  return monthName.slice(0, 3);
}

function listKnownMonthKeys(uid: string, currentMonthKey: string): string[] {
  const prefix = `cache:${uid}:habitTracker:`;
  const cachedMonthKeysWithData = listStorageKeys(prefix)
    .map((key) => key.slice(prefix.length))
    .filter((key) => MONTH_KEY_PATTERN.test(key))
    .filter((monthKey) => readCachedHabitMonth(uid, monthKey) !== null);
  const unique = new Set<string>([currentMonthKey, ...cachedMonthKeysWithData]);

  return Array.from(unique).sort(
    (left, right) => monthSortValue(right) - monthSortValue(left),
  );
}

export default function HabitTrackerInsightsWidget({ uid }: HabitTrackerInsightsWidgetProps) {
  const { monthKeyYm } = useLocalToday();
  const parsedCurrentMonth = useMemo(
    () => fromYearMonthKey(monthKeyYm) ?? { year: new Date().getFullYear(), monthIndex: new Date().getMonth() },
    [monthKeyYm],
  );
  const daysInCurrentMonth = useMemo(
    () => getDaysInMonth(parsedCurrentMonth.year, parsedCurrentMonth.monthIndex),
    [parsedCurrentMonth.year, parsedCurrentMonth.monthIndex],
  );

  const [meta, setMeta] = useState<HabitTrackerMeta | null>(null);
  const [monthStateByKey, setMonthStateByKey] = useState<Record<string, HabitMonthState>>(() => ({
    [monthKeyYm]: createEmptyMonthState(daysInCurrentMonth),
  }));
  const [selectedMonthKey, setSelectedMonthKey] = useState(monthKeyYm);
  const [isLoading, setIsLoading] = useState(false);

  const availableMonthKeys = useMemo(() => {
    const unique = new Set<string>([
      ...Object.keys(monthStateByKey),
      ...(uid ? listKnownMonthKeys(uid, monthKeyYm) : [monthKeyYm]),
    ]);

    return Array.from(unique).sort((left, right) => monthSortValue(right) - monthSortValue(left));
  }, [uid, monthKeyYm, monthStateByKey]);
  const effectiveSelectedMonthKey = availableMonthKeys.includes(selectedMonthKey)
    ? selectedMonthKey
    : (availableMonthKeys[0] ?? monthKeyYm);

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(() => {
      if (ignore) {
        return;
      }

      if (!uid) {
        setMonthStateByKey({
          [monthKeyYm]: createEmptyMonthState(daysInCurrentMonth),
        });
        return;
      }

      setMonthStateByKey((previous) => {
        let changed = false;
        const next = { ...previous };

        availableMonthKeys.forEach((monthKey) => {
          if (previous[monthKey]) {
            return;
          }

          const cached = readCachedHabitMonth(uid, monthKey);

          if (cached && !previous[monthKey]) {
            next[monthKey] = cached;
            changed = true;
          }
        });

        if (!previous[monthKeyYm]) {
          next[monthKeyYm] = createEmptyMonthState(daysInCurrentMonth);
          changed = true;
        }

        return changed ? next : previous;
      });
    });

    return () => {
      ignore = true;
    };
  }, [uid, availableMonthKeys, monthKeyYm, daysInCurrentMonth]);

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(async () => {
      if (!uid) {
        if (!ignore) {
          setMeta(null);
          setMonthStateByKey({
            [monthKeyYm]: createEmptyMonthState(daysInCurrentMonth),
          });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      const loadedMeta = await loadHabitTrackerMeta(uid);

      if (ignore) {
        return;
      }

      setMeta(loadedMeta);

      const cachedCurrentMonth = readCachedHabitMonth(uid, monthKeyYm);
      setMonthStateByKey((previous) => ({
        ...previous,
        [monthKeyYm]:
          cachedCurrentMonth ??
          previous[monthKeyYm] ??
          createEmptyMonthState(daysInCurrentMonth),
      }));

      const loadedMonth = await loadHabitMonth(uid, monthKeyYm);

      if (ignore) {
        return;
      }

      setMonthStateByKey((previous) => ({
        ...previous,
        [monthKeyYm]: loadedMonth,
      }));
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [uid, monthKeyYm, daysInCurrentMonth]);

  const selectedMonth = useMemo(
    () => fromYearMonthKey(effectiveSelectedMonthKey) ?? parsedCurrentMonth,
    [effectiveSelectedMonthKey, parsedCurrentMonth],
  );
  const selectedDaysInMonth = useMemo(
    () => getDaysInMonth(selectedMonth.year, selectedMonth.monthIndex),
    [selectedMonth.year, selectedMonth.monthIndex],
  );
  const selectedMonthState = useMemo(
    () =>
      monthStateByKey[effectiveSelectedMonthKey] ??
      (uid ? readCachedHabitMonth(uid, effectiveSelectedMonthKey) : null) ??
      createEmptyMonthState(selectedDaysInMonth),
    [monthStateByKey, uid, effectiveSelectedMonthKey, selectedDaysInMonth],
  );
  const selectedMonthLabel = useMemo(
    () => formatMonthLabel(effectiveSelectedMonthKey),
    [effectiveSelectedMonthKey],
  );
  const monthSelectDisabled = availableMonthKeys.length <= 1;

  const windowStartDate = useMemo(() => resolveWindowStartDate(meta), [meta]);

  const monthMetrics = useMemo(
    () => calculateMonthMetrics(selectedMonthState, selectedDaysInMonth),
    [selectedMonthState, selectedDaysInMonth],
  );
  const normalizedProgressPercent = useMemo(
    () => Math.max(0, Math.min(100, monthMetrics.progressPercent)),
    [monthMetrics.progressPercent],
  );

  const visibleMonthStartIndex = useMemo(() => {
    if (!windowStartDate) {
      return 0;
    }

    if (
      selectedMonth.year !== windowStartDate.getFullYear() ||
      selectedMonth.monthIndex !== windowStartDate.getMonth()
    ) {
      return 0;
    }

    return Math.min(selectedDaysInMonth - 1, Math.max(0, dayIndexInMonth(windowStartDate)));
  }, [selectedMonth.year, selectedMonth.monthIndex, windowStartDate, selectedDaysInMonth]);

  const progressChartValues = useMemo(
    () => monthMetrics.perDayProgressPercent.slice(visibleMonthStartIndex),
    [monthMetrics.perDayProgressPercent, visibleMonthStartIndex],
  );

  const moodChartValues = useMemo(
    () => selectedMonthState.mood.slice(visibleMonthStartIndex),
    [selectedMonthState.mood, visibleMonthStartIndex],
  );

  const motivationChartValues = useMemo(
    () => selectedMonthState.motivation.slice(visibleMonthStartIndex),
    [selectedMonthState.motivation, visibleMonthStartIndex],
  );

  const rawYearlyStatistics = useMemo<YearlyMonthStatistic[]>(() => {
    const computed = calculateYearlyStatistics(
      selectedMonth.year,
      (year, monthIndex) => {
        const monthKey = toYearMonthKey(year, monthIndex);

        if (monthKey === effectiveSelectedMonthKey) {
          return selectedMonthState;
        }

        if (monthStateByKey[monthKey]) {
          return monthStateByKey[monthKey];
        }

        if (!uid) {
          return null;
        }

        return readCachedHabitMonth(uid, monthKey);
      },
    );

    const hasAnyValues = computed.some(
      (month) => month.habitsCount > 0 || month.completedChecks > 0,
    );

    if (hasAnyValues) {
      return computed;
    }

    const cache = loadYearStatisticsCache(selectedMonth.year);

    if (cache?.months?.length === 12) {
      return cache.months;
    }

    return computed;
  }, [selectedMonth.year, effectiveSelectedMonthKey, selectedMonthState, monthStateByKey, uid]);

  const yearlyStatistics = useMemo(() => {
    if (!windowStartDate) {
      return [];
    }

    const firstEntryYear = windowStartDate.getFullYear();
    const firstEntryMonthIndex = windowStartDate.getMonth();

    if (selectedMonth.year < firstEntryYear) {
      return [];
    }

    if (selectedMonth.year > firstEntryYear) {
      return rawYearlyStatistics;
    }

    return rawYearlyStatistics.filter((month) => month.monthIndex >= firstEntryMonthIndex);
  }, [windowStartDate, rawYearlyStatistics, selectedMonth.year]);

  return (
    <section className="relative z-10 space-y-4">
      <SectionCard title={`Yearly Statistics (${selectedMonth.year})`}>
        {isLoading ? (
          <div className="flex h-44 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/65">
            Loading yearly statistics...
          </div>
        ) : yearlyStatistics.length ? (
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <AreaChart
              values={yearlyStatistics.map((month) => month.progressPercent)}
              maxValue={100}
              minValue={0}
              strokeColor="#86efac"
              fillColor="rgba(134, 239, 172, 0.2)"
              className="h-44"
            />

            <div
              className="mt-1 grid gap-1 text-center text-xs font-medium text-white/60"
              style={{ gridTemplateColumns: `repeat(${yearlyStatistics.length}, minmax(0, 1fr))` }}
            >
              {yearlyStatistics.map((month) => (
                <span key={`label-${selectedMonth.year}-${month.monthIndex}`}>
                  {shortLabel(month.monthName)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/65">
            No yearly statistics available for this period.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Month Insights"
        actions={(
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/65">
            <span>Month</span>
            <select
              value={effectiveSelectedMonthKey}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              disabled={monthSelectDisabled}
              className="min-w-48 rounded-lg border border-white/20 bg-black/30 px-2.5 py-1.5 text-sm normal-case tracking-normal text-white/90 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Select habit insights month"
            >
              {availableMonthKeys.map((monthKey) => (
                <option key={monthKey} value={monthKey} className="bg-[#0b0f19] text-white">
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>
          </label>
        )}
      >
        {isLoading && effectiveSelectedMonthKey === monthKeyYm ? (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/65">
            Loading habit insights...
          </div>
        ) : windowStartDate ? (
          <div className="grid min-w-0 gap-4 xl:grid-cols-12">
            <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-4 xl:col-span-4">
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                Selected month
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{selectedMonthLabel}</h3>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-2.5 py-1 text-xs font-medium text-white/90">
                  <ListChecks className="h-3.5 w-3.5 text-white/70" />
                  Habits: {monthMetrics.habitsCount}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-2.5 py-1 text-xs font-medium text-white/90">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300/90" />
                  Completed: {monthMetrics.completedChecks}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-3">
                <MiniDonut
                  done={monthMetrics.completedChecks}
                  total={Math.max(monthMetrics.completedChecks, monthMetrics.totalPossible)}
                  size={52}
                  doneColor="rgba(110, 231, 183, 0.95)"
                  remainingColor="rgba(255,255,255,0.16)"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-white/60">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Progress
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {monthMetrics.progressPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/12">
                    <div
                      className="h-full rounded-full bg-emerald-300/85 transition-all duration-500"
                      style={{ width: `${normalizedProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:col-span-8 xl:grid-cols-3">
              <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="flex h-9 items-center text-sm font-semibold text-white/85">
                  Monthly Completion Progress
                </div>
                <div className="h-[210px] w-full overflow-hidden">
                  <MonthlyProgressChart dailyProgressPercent={progressChartValues} className="h-full" />
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="flex h-9 items-center text-sm font-semibold text-white/85">
                  Mood (1-10)
                </div>
                <div className="h-[210px] w-full overflow-hidden">
                  <AreaChart
                    values={moodChartValues}
                    maxValue={10}
                    minValue={0}
                    strokeColor="#7fb46c"
                    fillColor="rgba(139, 190, 118, 0.22)"
                    className="h-full"
                  />
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="flex h-9 items-center text-sm font-semibold text-white/85">
                  Motivation (1-10)
                </div>
                <div className="h-[210px] w-full overflow-hidden">
                  <AreaChart
                    values={motivationChartValues}
                    maxValue={10}
                    minValue={0}
                    strokeColor="#b9829c"
                    fillColor="rgba(196, 142, 170, 0.24)"
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-center text-sm text-white/65">
            Create your first habit entry to unlock insights.
          </div>
        )}
      </SectionCard>
    </section>
  );
}
