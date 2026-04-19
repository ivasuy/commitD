"use client";

import { useEffect, useMemo, useState } from "react";

import SectionCard from "@/src/components/layout/SectionCard";
import OverallProgress from "@/src/components/weekly-planner/OverallProgress";
import { useLocalToday } from "@/src/hooks/useLocalToday";
import {
  loadWeeklyPlanner,
  loadWeeklyPlannerMeta,
  readCachedWeeklyPlanner,
  type WeeklyPlannerMeta,
} from "@/src/lib/db/store";
import { getFirstEntryDate, isBeforeFirstEntry } from "@/src/lib/date/firstEntryWindow";
import { listStorageKeys } from "@/src/lib/storage";
import { addDaysLocal, parseLocalYMD } from "@/src/lib/time/localTime";
import { getWeekDays } from "@/src/lib/weekly-planner/date";
import { calculateWeeklyMetrics } from "@/src/lib/weekly-planner/metrics";
import {
  createDefaultWeekData,
  type DayIndex,
  type NoteLines,
  type WeeklyPlannerData,
} from "@/src/lib/weekly-planner/storage";

interface OverallProgressWidgetProps {
  uid: string | null;
}

const WEEK_START_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const weekLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatWeekRange(weekStart: string): string {
  const startDate = parseLocalYMD(weekStart);
  const endDate = parseLocalYMD(addDaysLocal(weekStart, 6));
  return `${weekLabelFormatter.format(startDate)} - ${weekLabelFormatter.format(endDate)}`;
}

function getWeekStartYmd(ymd: string): string {
  const parsed = parseLocalYMD(ymd);
  const mondayOffset = (parsed.getDay() + 6) % 7;
  return addDaysLocal(ymd, -mondayOffset);
}

function hasMeaningfulNoteText(lines: NoteLines): boolean {
  return lines.some((line) => line.trim().length > 0);
}

function hasWeekEntryOnDay(data: WeeklyPlannerData, dayIndex: DayIndex): boolean {
  if (data.tasksByDay[dayIndex].length > 0) {
    return true;
  }

  if (data.recurringTasks.some((task) => task.checks[dayIndex])) {
    return true;
  }

  const dayNotes = data.notesByDay[dayIndex];

  return (
    hasMeaningfulNoteText(dayNotes.notes) ||
    hasMeaningfulNoteText(dayNotes.improve) ||
    hasMeaningfulNoteText(dayNotes.thanks)
  );
}

function resolveFirstEntryDay(meta: WeeklyPlannerMeta | null, fallbackWeekStart: string): Date | null {
  if (!meta) {
    return null;
  }

  const firstEntry = getFirstEntryDate(meta);

  if (firstEntry) {
    return new Date(firstEntry.getFullYear(), firstEntry.getMonth(), firstEntry.getDate());
  }

  const weekStartYmd = meta.firstWeekStart ?? fallbackWeekStart;
  const parsed = parseLocalYMD(weekStartYmd);

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function isDateInsideWeek(date: Date, weekStart: string): boolean {
  const dateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const weekStartTime = parseLocalYMD(weekStart).getTime();
  const weekEndTime = parseLocalYMD(addDaysLocal(weekStart, 6)).getTime();

  return dateTime >= weekStartTime && dateTime <= weekEndTime;
}

function resolveWeekFirstEntryDay(
  data: WeeklyPlannerData,
  metaFirstEntryDay: Date | null,
): Date | null {
  const weekDays = getWeekDays(data.weekStart);
  const firstDayWithEntry = weekDays.find((day) => hasWeekEntryOnDay(data, day.index));

  if (firstDayWithEntry) {
    return firstDayWithEntry.date;
  }

  if (metaFirstEntryDay && isDateInsideWeek(metaFirstEntryDay, data.weekStart)) {
    return new Date(
      metaFirstEntryDay.getFullYear(),
      metaFirstEntryDay.getMonth(),
      metaFirstEntryDay.getDate(),
    );
  }

  return null;
}

function listKnownWeekStarts(uid: string, currentWeekStart: string): string[] {
  const prefix = `cache:${uid}:weeklyPlanner:`;
  const cachedWeekStartsWithData = listStorageKeys(prefix)
    .map((key) => key.slice(prefix.length))
    .filter((key) => WEEK_START_PATTERN.test(key))
    .filter((weekStart) => readCachedWeeklyPlanner(uid, weekStart) !== null);
  const unique = new Set<string>([currentWeekStart, ...cachedWeekStartsWithData]);

  return Array.from(unique).sort(
    (left, right) => parseLocalYMD(right).getTime() - parseLocalYMD(left).getTime(),
  );
}

function hasWeekTaskData(data: WeeklyPlannerData): boolean {
  const metrics = calculateWeeklyMetrics(data);
  const totalTasks = metrics.overall.total;
  const completed = metrics.overall.completed;
  const notCompleted = totalTasks - completed;
  const hasTaskEntry = Object.values(data.tasksByDay).some((tasks) => tasks.length > 0);

  return hasTaskEntry || totalTasks > 0 || completed + notCompleted > 0;
}

export default function OverallProgressWidget({ uid }: OverallProgressWidgetProps) {
  const { todayYmd } = useLocalToday();
  const currentWeekStart = useMemo(() => getWeekStartYmd(todayYmd), [todayYmd]);

  const [plannerDataByWeek, setPlannerDataByWeek] = useState<Record<string, WeeklyPlannerData>>(
    () => ({
      [currentWeekStart]: createDefaultWeekData(currentWeekStart, todayYmd),
    }),
  );
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [meta, setMeta] = useState<WeeklyPlannerMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const knownWeekStarts = useMemo(() => {
    if (!uid) {
      return [currentWeekStart];
    }

    return listKnownWeekStarts(uid, currentWeekStart);
  }, [uid, currentWeekStart]);

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(() => {
      if (ignore) {
        return;
      }

      if (!uid) {
        setPlannerDataByWeek({
          [currentWeekStart]: createDefaultWeekData(currentWeekStart, todayYmd),
        });
        return;
      }

      setPlannerDataByWeek((previous) => {
        let changed = false;
        const next: Record<string, WeeklyPlannerData> = { ...previous };

        knownWeekStarts.forEach((weekStart) => {
          if (previous[weekStart]) {
            return;
          }

          const cached = readCachedWeeklyPlanner(uid, weekStart);

          if (cached && !previous[weekStart]) {
            next[weekStart] = cached;
            changed = true;
            return;
          }
        });

        if (!previous[currentWeekStart]) {
          next[currentWeekStart] = createDefaultWeekData(currentWeekStart, todayYmd);
          changed = true;
        }

        return changed ? next : previous;
      });
    });

    return () => {
      ignore = true;
    };
  }, [uid, knownWeekStarts, currentWeekStart, todayYmd]);

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(async () => {
      if (!uid) {
        if (!ignore) {
          setMeta(null);
          setPlannerDataByWeek({
            [currentWeekStart]: createDefaultWeekData(currentWeekStart, todayYmd),
          });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      const loadedMeta = await loadWeeklyPlannerMeta(uid);

      if (ignore) {
        return;
      }

      setMeta(loadedMeta);

      const cachedCurrentWeek = readCachedWeeklyPlanner(uid, currentWeekStart);
      setPlannerDataByWeek((previous) => ({
        ...previous,
        [currentWeekStart]:
          cachedCurrentWeek ??
          previous[currentWeekStart] ??
          createDefaultWeekData(currentWeekStart, todayYmd),
      }));

      const loaded = await loadWeeklyPlanner(uid, currentWeekStart, todayYmd);

      if (ignore) {
        return;
      }

      setPlannerDataByWeek((previous) => ({
        ...previous,
        [currentWeekStart]: loaded,
      }));
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [uid, currentWeekStart, todayYmd]);

  const availableWeeks = useMemo(() => {
    const weeksWithData = Object.entries(plannerDataByWeek)
      .filter(([, weekData]) => hasWeekTaskData(weekData))
      .map(([weekStart]) => weekStart);

    return weeksWithData.sort(
      (left, right) => parseLocalYMD(right).getTime() - parseLocalYMD(left).getTime(),
    );
  }, [plannerDataByWeek]);
  const defaultWeekStart = useMemo(() => {
    if (!availableWeeks.length) {
      return null;
    }

    if (availableWeeks.includes(currentWeekStart)) {
      return currentWeekStart;
    }

    return availableWeeks[0];
  }, [availableWeeks, currentWeekStart]);
  const effectiveSelectedWeekStart = useMemo(() => {
    if (!availableWeeks.length) {
      return null;
    }

    if (availableWeeks.includes(selectedWeekStart)) {
      return selectedWeekStart;
    }

    return defaultWeekStart;
  }, [availableWeeks, selectedWeekStart, defaultWeekStart]);

  const plannerData = useMemo(() => {
    if (!effectiveSelectedWeekStart) {
      return null;
    }

    return (
      plannerDataByWeek[effectiveSelectedWeekStart] ??
      (uid ? readCachedWeeklyPlanner(uid, effectiveSelectedWeekStart) : null)
    );
  }, [plannerDataByWeek, uid, effectiveSelectedWeekStart]);

  const firstEntryDay = useMemo(
    () => resolveFirstEntryDay(meta, currentWeekStart),
    [meta, currentWeekStart],
  );

  const weekDays = useMemo(
    () => (plannerData ? getWeekDays(plannerData.weekStart) : []),
    [plannerData],
  );

  const weekFirstEntryDay = useMemo(
    () => (plannerData ? resolveWeekFirstEntryDay(plannerData, firstEntryDay) : null),
    [plannerData, firstEntryDay],
  );

  const visibleWeekDays = useMemo(() => {
    if (!plannerData) {
      return [];
    }

    if (!weekFirstEntryDay) {
      return weekDays;
    }

    return weekDays.filter((day) => !isBeforeFirstEntry(day.date, weekFirstEntryDay));
  }, [plannerData, weekDays, weekFirstEntryDay]);

  const metrics = useMemo(
    () => (plannerData ? calculateWeeklyMetrics(plannerData) : null),
    [plannerData],
  );
  const visibleDayMetricsList = useMemo(
    () => (metrics ? visibleWeekDays.map((day) => metrics.dayMetrics[day.index]) : []),
    [visibleWeekDays, metrics],
  );

  const hasWeeklyData = availableWeeks.length > 0;
  const isCurrentWeekSelected = effectiveSelectedWeekStart === currentWeekStart;
  const weekSelectDisabled = availableWeeks.length <= 1;
  const selectedWeekLabel = plannerData ? formatWeekRange(plannerData.weekStart) : "";

  return (
    <section className="relative z-10 h-full">
      <SectionCard
        title="Weekly Progress"
        className="h-full"
        actions={hasWeeklyData ? (
          <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/65">
            <span>Week</span>
            <select
              value={effectiveSelectedWeekStart ?? ""}
              onChange={(event) => setSelectedWeekStart(event.target.value)}
              disabled={weekSelectDisabled}
              className="min-w-44 rounded-lg border border-white/20 bg-black/30 px-2.5 py-1.5 text-sm normal-case tracking-normal text-white/90 outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Select week"
            >
              {availableWeeks.map((weekStart) => (
                <option key={weekStart} value={weekStart} className="bg-[#0b0f19] text-white">
                  {formatWeekRange(weekStart)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      >
        {hasWeeklyData ? (
          <p className="mb-3 text-sm text-white/65">{selectedWeekLabel}</p>
        ) : null}

        {!hasWeeklyData ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/65">
            No weekly data yet
          </div>
        ) : isLoading && isCurrentWeekSelected ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/65">
            Loading weekly progress...
          </div>
        ) : metrics ? (
          <OverallProgress
            weekDays={visibleWeekDays}
            dayMetricsList={visibleDayMetricsList}
            overall={metrics.overall}
            title={null}
          />
        ) : (
          <div className="flex h-52 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/65">
            No weekly data yet
          </div>
        )}
      </SectionCard>
    </section>
  );
}
