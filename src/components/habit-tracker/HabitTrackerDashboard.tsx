"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SectionCard from "@/src/components/layout/SectionCard";
import HabitTrackerGrid from "@/src/components/habit-tracker/HabitTrackerGrid";
import MonthHeaderStats from "@/src/components/habit-tracker/MonthHeaderStats";
import { useAuth } from "@/src/hooks/useAuth";
import { useLocalToday } from "@/src/hooks/useLocalToday";
import { useSaveOnBlur } from "@/src/hooks/useSaveOnBlur";
import {
  ensureHabitTrackerMeta,
  loadHabitMonth,
  loadHabitTrackerMeta,
  readCachedHabitMonth,
  readSelectedHabitMonth,
  saveHabitMonth,
  saveSelectedHabitMonth,
  type HabitTrackerMeta,
} from "@/src/lib/db/store";
import {
  buildMonthCalendar,
  clampYear,
  fromYearMonthKey,
  getDaysInMonth,
  normalizeMonthIndex,
  toYearMonthKey,
  type CalendarCell,
} from "@/src/lib/date";
import {
  clampToFirstEntry,
  getFirstEntryDate,
  isBeforeFirstEntry,
  isMonthBeforeFirstEntry,
  isWeekBeforeFirstEntry,
} from "@/src/lib/date/firstEntryWindow";
import {
  buildYearStatisticsCache,
  calculateMonthMetrics,
  calculateYearlyStatistics,
} from "@/src/lib/habit-tracker/metrics";
import {
  saveYearStatisticsCache,
} from "@/src/lib/habit-tracker/storage";
import type { HabitMonthState } from "@/src/lib/habit-tracker/types";
import { debounce } from "@/src/lib/storage";
import { parseLocalYMD, toLocalYMD } from "@/src/lib/time/localTime";

interface HabitTrackerState {
  year: number;
  monthIndex: number;
  monthState: HabitMonthState;
}

interface WeekInfo {
  index: number;
  week: CalendarCell[];
  maskedWeek: CalendarCell[];
  weekStart: Date;
  weekStartYmd: string;
}

const HABIT_WEEK_START_DAY = 1;
const HABIT_WEEKDAY_LABELS: CalendarCell["weekdayLabel"][] = [
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
  "Su",
];

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfHabitWeek(date: Date): Date {
  const dayStart = startOfDay(date);
  const dayOffset = (dayStart.getDay() - HABIT_WEEK_START_DAY + 7) % 7;
  dayStart.setDate(dayStart.getDate() - dayOffset);
  return dayStart;
}

function toYmd(date: Date): string {
  return toLocalYMD(startOfDay(date));
}

function isPastDay(date: Date, todayYmd: string): boolean {
  return startOfDay(date).getTime() < startOfDay(parseLocalYMD(todayYmd)).getTime();
}

function getCachedMonthState(
  uid: string | null,
  year: number,
  monthIndex: number,
): HabitMonthState {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const monthKey = toYearMonthKey(year, monthIndex);
  const cached = uid ? readCachedHabitMonth(uid, monthKey) : null;

  return cached ?? createEmptyHabitMonthState(daysInMonth);
}

function createEmptyHabitMonthState(daysInMonth: number): HabitMonthState {
  return {
    habits: [],
    checksByHabitId: {},
    mood: Array.from({ length: daysInMonth }, () => 0),
    motivation: Array.from({ length: daysInMonth }, () => 0),
  };
}

function createInitialState(monthKeyYm: string, uid: string | null): HabitTrackerState {
  const parsed = fromYearMonthKey(monthKeyYm) ?? {
    year: 1970,
    monthIndex: 0,
  };

  return {
    year: parsed.year,
    monthIndex: parsed.monthIndex,
    monthState: getCachedMonthState(uid, parsed.year, parsed.monthIndex),
  };
}

function clampMonthKeyToWindow(monthKeyYm: string, windowStartDate: Date): string {
  const parsed = fromYearMonthKey(monthKeyYm);

  if (!parsed) {
    return toYearMonthKey(windowStartDate.getFullYear(), windowStartDate.getMonth());
  }

  const parsedKey = toYearMonthKey(parsed.year, parsed.monthIndex);

  if (isMonthBeforeFirstEntry(parsedKey, windowStartDate)) {
    return toYearMonthKey(windowStartDate.getFullYear(), windowStartDate.getMonth());
  }

  return parsedKey;
}

function clampMonthSelection(year: number, monthIndex: number, windowStartDate: Date): {
  year: number;
  monthIndex: number;
} {
  const normalizedYear = clampYear(year);
  const normalizedMonth = normalizeMonthIndex(monthIndex);
  const clampedKey = clampMonthKeyToWindow(
    toYearMonthKey(normalizedYear, normalizedMonth),
    windowStartDate,
  );
  const parsed = fromYearMonthKey(clampedKey);

  if (parsed) {
    return parsed;
  }

  return {
    year: windowStartDate.getFullYear(),
    monthIndex: windowStartDate.getMonth(),
  };
}

function buildWeekInfos(
  year: number,
  monthIndex: number,
  windowStartDate: Date,
): WeekInfo[] {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  const firstWeekStart = startOfHabitWeek(monthStart);
  const weeks: WeekInfo[] = [];
  const weekStart = new Date(firstWeekStart);
  let weekIndex = 0;

  while (weekStart.getTime() <= monthEnd.getTime()) {
    const weekStartYmd = toYmd(weekStart);

    if (!isWeekBeforeFirstEntry(weekStartYmd, windowStartDate)) {
      const week = Array.from({ length: 7 }, (_, dayIndexInWeek) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayIndexInWeek);
        const isInMonth =
          dayDate.getFullYear() === year && dayDate.getMonth() === monthIndex;

        return {
          weekIndex,
          dayIndexInWeek,
          dayNumber: isInMonth ? dayDate.getDate() : null,
          weekdayLabel: HABIT_WEEKDAY_LABELS[dayIndexInWeek],
          dateKey: isInMonth ? toYmd(dayDate) : null,
        } satisfies CalendarCell;
      });

      const maskedWeek = week.map((cell, dayIndexInWeek) => {
        if (cell.dayNumber === null) {
          return cell;
        }

        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayIndexInWeek);

        if (!isBeforeFirstEntry(dayDate, windowStartDate)) {
          return cell;
        }

        return {
          ...cell,
          dayNumber: null,
          dateKey: null,
        } satisfies CalendarCell;
      });

      const hasVisibleMonthDay = maskedWeek.some((cell) => cell.dayNumber !== null);

      if (hasVisibleMonthDay) {
        weeks.push({
          index: weekIndex,
          week,
          maskedWeek,
          weekStart: new Date(weekStart),
          weekStartYmd,
        });
      }
    }

    weekStart.setDate(weekStart.getDate() + 7);
    weekIndex += 1;
  }

  return weeks;
}

function findWeekStartForDate(weekInfos: WeekInfo[], dateYmd: string): string | null {
  const match = weekInfos.find((weekInfo) =>
    weekInfo.week.some((cell) => cell.dateKey === dateYmd),
  );

  return match?.weekStartYmd ?? null;
}

const weekRangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatWeekRangeLabel(weekStartYmd: string): string {
  const startDate = parseLocalYMD(weekStartYmd);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return `${weekRangeFormatter.format(startDate)} - ${weekRangeFormatter.format(endDate)}`;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.round(value);
  return Math.max(0, Math.min(10, rounded));
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
    return startOfDay(parseLocalYMD(meta.firstWeekStart));
  }

  if (meta.firstMonthKey) {
    const parsed = fromYearMonthKey(meta.firstMonthKey);

    if (parsed) {
      return startOfDay(new Date(parsed.year, parsed.monthIndex, 1));
    }
  }

  return null;
}

export default function HabitTrackerDashboard() {
  const { monthKeyYm, todayYmd } = useLocalToday();
  const { user } = useAuth();

  const [trackerState, setTrackerState] = useState<HabitTrackerState>(() =>
    createInitialState(monthKeyYm, null),
  );
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedWeekStartYmd, setSelectedWeekStartYmd] = useState(() =>
    toYmd(startOfHabitWeek(new Date())),
  );
  const weekNavDirectionRef = useRef(0); // -1 = prev, 1 = next, 0 = pill click
  const [meta, setMeta] = useState<HabitTrackerMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const windowStartDate = useMemo(() => {
    return resolveWindowStartDate(meta);
  }, [meta]);

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(async () => {
      if (!user) {
        if (!ignore) {
          setMeta(null);
          setMetaLoading(false);
        }
        return;
      }

      setMetaLoading(true);
      const loadedMeta = await loadHabitTrackerMeta(user.uid);

      if (ignore) {
        return;
      }

      setMeta(loadedMeta);
      setMetaLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [user]);

  const daysInMonth = getDaysInMonth(trackerState.year, trackerState.monthIndex);

  const calendar = useMemo(
    () => buildMonthCalendar(trackerState.year, trackerState.monthIndex),
    [trackerState.year, trackerState.monthIndex],
  );

  const weekInfos = useMemo(() => {
    if (!windowStartDate) {
      return [];
    }

    return buildWeekInfos(trackerState.year, trackerState.monthIndex, windowStartDate);
  }, [trackerState.year, trackerState.monthIndex, windowStartDate]);

  const selectedWeekPosition = useMemo(
    () => weekInfos.findIndex((weekInfo) => weekInfo.weekStartYmd === selectedWeekStartYmd),
    [weekInfos, selectedWeekStartYmd],
  );

  const safeSelectedWeekPosition = selectedWeekPosition >= 0 ? selectedWeekPosition : 0;
  const selectedWeekInfo = weekInfos[safeSelectedWeekPosition] ?? null;
  const selectedWeek = useMemo(
    () => selectedWeekInfo?.maskedWeek ?? [],
    [selectedWeekInfo],
  );
  const selectedWeekIndex = selectedWeekInfo?.index ?? 0;

  const isDayEditable = useCallback(
    (dayNumber: number): boolean => {
      if (!windowStartDate) {
        return false;
      }

      if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > daysInMonth) {
        return false;
      }

      const dayDate = new Date(trackerState.year, trackerState.monthIndex, dayNumber);

      if (isBeforeFirstEntry(dayDate, windowStartDate)) {
        return false;
      }

      return !isPastDay(dayDate, todayYmd);
    },
    [windowStartDate, daysInMonth, trackerState.year, trackerState.monthIndex, todayYmd],
  );

  const canEditWeek = useMemo(
    () =>
      selectedWeek.some(
        (cell) => cell.dayNumber !== null && isDayEditable(cell.dayNumber),
      ),
    [selectedWeek, isDayEditable],
  );

  const canPersistMonth = useMemo(() => {
    if (!windowStartDate) {
      return false;
    }

    return calendar.flatCells.some((cell) => {
      if (cell.dayNumber === null) {
        return false;
      }

      const dayDate = new Date(trackerState.year, trackerState.monthIndex, cell.dayNumber);

      if (isBeforeFirstEntry(dayDate, windowStartDate)) {
        return false;
      }

      return !isPastDay(dayDate, todayYmd);
    });
  }, [calendar, trackerState.year, trackerState.monthIndex, windowStartDate, todayYmd]);

  const monthMetrics = useMemo(
    () => calculateMonthMetrics(trackerState.monthState, daysInMonth),
    [trackerState.monthState, daysInMonth],
  );

  const debouncedPersist = useMemo(
    () =>
      debounce((state: HabitTrackerState) => {
        if (!user) {
          return;
        }

        const monthKey = toYearMonthKey(state.year, state.monthIndex);
        void saveHabitMonth(user.uid, monthKey, state.monthState);
        saveSelectedHabitMonth(user.uid, monthKey);

        const yearlyMonths = calculateYearlyStatistics(
          state.year,
          (year, monthIndex) => {
            if (year === state.year && monthIndex === state.monthIndex) {
              return state.monthState;
            }

            const cacheKey = toYearMonthKey(year, monthIndex);
            return readCachedHabitMonth(user.uid, cacheKey);
          },
        );

        saveYearStatisticsCache(
          state.year,
          buildYearStatisticsCache(state.year, yearlyMonths),
        );
      }, 900),
    [user],
  );

  useEffect(() => {
    if (!user || !isHydrated || !canPersistMonth) {
      return;
    }

    debouncedPersist(trackerState);

    return () => {
      debouncedPersist.cancel();
    };
  }, [trackerState, debouncedPersist, user, isHydrated, canPersistMonth]);

  useSaveOnBlur(() => {
    if (canPersistMonth) {
      debouncedPersist.flush();
    }
  });

  const switchMonth = useCallback(
    (
      year: number,
      monthIndex: number,
      options?: {
        preferredDayYmd?: string;
      },
    ) => {
      if (!windowStartDate) {
        return;
      }

      const clampedSelection = clampMonthSelection(year, monthIndex, windowStartDate);
      const nextYear = clampedSelection.year;
      const nextMonth = clampedSelection.monthIndex;
      const nextMonthKey = toYearMonthKey(nextYear, nextMonth);
      const nextWeekInfos = buildWeekInfos(nextYear, nextMonth, windowStartDate);

      const clampedToday = clampToFirstEntry(parseLocalYMD(todayYmd), windowStartDate);
      const clampedTodayMonthKey = toYearMonthKey(
        clampedToday.getFullYear(),
        clampedToday.getMonth(),
      );

      const preferredDayYmd =
        options?.preferredDayYmd ??
        (clampedTodayMonthKey === nextMonthKey ? toYmd(clampedToday) : "");

      const preferredWeekStart = preferredDayYmd
        ? findWeekStartForDate(nextWeekInfos, preferredDayYmd)
        : null;

      const fallbackWeekStart =
        nextWeekInfos[0]?.weekStartYmd ??
        toYmd(startOfHabitWeek(new Date(nextYear, nextMonth, 1)));

      const nextWeekStartYmd = preferredWeekStart ?? fallbackWeekStart;

      setTrackerState({
        year: nextYear,
        monthIndex: nextMonth,
        monthState: getCachedMonthState(user?.uid ?? null, nextYear, nextMonth),
      });
      setSelectedWeekStartYmd(nextWeekStartYmd);
      setHighlightedHabitId(null);
      setIsHydrated(true);

      if (user) {
        saveSelectedHabitMonth(user.uid, nextMonthKey);
        void loadHabitMonth(user.uid, nextMonthKey).then((state) => {
          setTrackerState((previous) => {
            if (previous.year !== nextYear || previous.monthIndex !== nextMonth) {
              return previous;
            }

            return {
              ...previous,
              monthState: state,
            };
          });
        });
      }
    },
    [windowStartDate, todayYmd, user],
  );

  useEffect(() => {
    if (!user || !windowStartDate) {
      return;
    }

    const defaultMonthKey = clampMonthKeyToWindow(monthKeyYm, windowStartDate);
    const cachedMonthKey = readSelectedHabitMonth(user.uid, defaultMonthKey);
    const initialMonthKey = clampMonthKeyToWindow(cachedMonthKey, windowStartDate);
    const parsed = fromYearMonthKey(initialMonthKey);

    if (!parsed) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      switchMonth(parsed.year, parsed.monthIndex);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [user, monthKeyYm, windowStartDate, switchMonth]);

  const handleStartTracking = async () => {
    if (!user) {
      return;
    }

    setIsStarting(true);

    const parsedCurrentMonth = fromYearMonthKey(monthKeyYm) ?? {
      year: parseLocalYMD(todayYmd).getFullYear(),
      monthIndex: parseLocalYMD(todayYmd).getMonth(),
    };

    const starterState = createEmptyHabitMonthState(
      getDaysInMonth(parsedCurrentMonth.year, parsedCurrentMonth.monthIndex),
    );
    const firstWeekStart = toYmd(startOfHabitWeek(parseLocalYMD(todayYmd)));

    try {
      await saveHabitMonth(user.uid, monthKeyYm, starterState);
      const nextMeta = await ensureHabitTrackerMeta(user.uid, {
        firstWeekStart,
        firstMonthKey: monthKeyYm,
        firstEntryAt: new Date(),
      });
      saveSelectedHabitMonth(user.uid, monthKeyYm);
      setMeta(nextMeta);
      setIsHydrated(true);
    } finally {
      setIsStarting(false);
    }
  };

  const handleMonthChange = (monthIndex: number) => {
    if (!windowStartDate) {
      return;
    }

    const monthKey = toYearMonthKey(trackerState.year, normalizeMonthIndex(monthIndex));

    if (isMonthBeforeFirstEntry(monthKey, windowStartDate)) {
      switchMonth(windowStartDate.getFullYear(), windowStartDate.getMonth());
      return;
    }

    switchMonth(trackerState.year, monthIndex);
  };

  const handleYearChange = (year: number) => {
    if (!windowStartDate || !Number.isFinite(year)) {
      return;
    }

    switchMonth(year, trackerState.monthIndex);
  };

  const addHabit = (name: string) => {
    if (!canEditWeek) {
      return;
    }

    const habitId = createId();

    setTrackerState((previous) => {
      const currentDaysInMonth = getDaysInMonth(previous.year, previous.monthIndex);

      return {
        ...previous,
        monthState: {
          ...previous.monthState,
          habits: [
            ...previous.monthState.habits,
            {
              id: habitId,
              name,
              goal: 0,
            },
          ],
          checksByHabitId: {
            ...previous.monthState.checksByHabitId,
            [habitId]: Array.from({ length: currentDaysInMonth }, () => false),
          },
        },
      };
    });

    setHighlightedHabitId(habitId);
  };

  const renameHabit = (habitId: string, name: string) => {
    if (!canEditWeek) {
      return;
    }

    setTrackerState((previous) => ({
      ...previous,
      monthState: {
        ...previous.monthState,
        habits: previous.monthState.habits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                name,
              }
            : habit,
        ),
      },
    }));
  };

  const deleteHabit = (habitId: string) => {
    if (!canEditWeek) {
      return;
    }

    setTrackerState((previous) => {
      const checksByHabitId = { ...previous.monthState.checksByHabitId };
      delete checksByHabitId[habitId];

      return {
        ...previous,
        monthState: {
          ...previous.monthState,
          habits: previous.monthState.habits.filter((habit) => habit.id !== habitId),
          checksByHabitId,
        },
      };
    });

    if (highlightedHabitId === habitId) {
      setHighlightedHabitId(null);
    }
  };

  const updateGoal = (habitId: string, goal: number) => {
    if (!canEditWeek) {
      return;
    }

    setTrackerState((previous) => {
      const safeGoal = Number.isFinite(goal)
        ? Math.max(0, Math.min(7, Math.round(goal)))
        : 0;

      return {
        ...previous,
        monthState: {
          ...previous.monthState,
          habits: previous.monthState.habits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  goal: safeGoal,
                }
              : habit,
          ),
        },
      };
    });
  };

  const toggleCheck = (habitId: string, dayNumber: number) => {
    if (!isDayEditable(dayNumber)) {
      return;
    }

    setTrackerState((previous) => {
      const currentDaysInMonth = getDaysInMonth(previous.year, previous.monthIndex);
      const dayIndex = dayNumber - 1;
      const existingChecks =
        previous.monthState.checksByHabitId[habitId] ??
        Array.from({ length: currentDaysInMonth }, () => false);

      const updatedChecks = existingChecks.map((checked, index) =>
        index === dayIndex ? !checked : checked,
      );

      return {
        ...previous,
        monthState: {
          ...previous.monthState,
          checksByHabitId: {
            ...previous.monthState.checksByHabitId,
            [habitId]: updatedChecks,
          },
        },
      };
    });
  };

  const updateMood = (dayNumber: number, value: number) => {
    if (!isDayEditable(dayNumber)) {
      return;
    }

    const safeValue = clampScore(value);

    setTrackerState((previous) => ({
      ...previous,
      monthState: {
        ...previous.monthState,
        mood: previous.monthState.mood.map((score, index) =>
          index === dayNumber - 1 ? safeValue : score,
        ),
      },
    }));
  };

  const updateMotivation = (dayNumber: number, value: number) => {
    if (!isDayEditable(dayNumber)) {
      return;
    }

    const safeValue = clampScore(value);

    setTrackerState((previous) => ({
      ...previous,
      monthState: {
        ...previous.monthState,
        motivation: previous.monthState.motivation.map((score, index) =>
          index === dayNumber - 1 ? safeValue : score,
        ),
      },
    }));
  };

  const maxVisibleWeeks = Math.min(5, weekInfos.length);
  const visibleStart = Math.max(
    0,
    Math.min(safeSelectedWeekPosition - 2, Math.max(0, weekInfos.length - maxVisibleWeeks)),
  );
  const visibleWeekInfos = weekInfos.slice(visibleStart, visibleStart + maxVisibleWeeks);

  const canGoPrev = safeSelectedWeekPosition > 0;
  const canGoNext = safeSelectedWeekPosition < weekInfos.length - 1;

  const showMetaLoading = metaLoading && !windowStartDate;
  const showOnboarding = !metaLoading && !windowStartDate;

  if (showMetaLoading) {
    return (
      <SectionCard>
        <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-white/70">
          Loading tracking window...
        </div>
      </SectionCard>
    );
  }

  if (showOnboarding) {
    return (
      <SectionCard>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-semibold text-white">Start tracking habits</h2>
          <p className="max-w-xl text-sm text-white/70">
            Create your first tracker entry to unlock week and month navigation.
          </p>
          <button
            type="button"
            onClick={handleStartTracking}
            disabled={isStarting || !user}
            className="rounded-xl border border-emerald-400/60 bg-emerald-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? "Creating..." : "Create first week (today)"}
          </button>
        </div>
      </SectionCard>
    );
  }

  if (!windowStartDate) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      <SectionCard className="p-3 sm:p-4">
        <div className="space-y-5">
          <MonthHeaderStats
            monthIndex={trackerState.monthIndex}
            year={trackerState.year}
            habitsCount={monthMetrics.habitsCount}
            completedChecks={monthMetrics.completedChecks}
            progressPercent={monthMetrics.progressPercent}
            firstEntryDate={windowStartDate}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!canGoPrev) return;
                  const previous = weekInfos[safeSelectedWeekPosition - 1];
                  if (previous) {
                    weekNavDirectionRef.current = -1;
                    setSelectedWeekStartYmd(previous.weekStartYmd);
                  }
                }}
                disabled={!canGoPrev}
                aria-label="Previous week"
                className="rounded-xl border border-white/20 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {visibleWeekInfos.map((weekInfo) => {
                const isSelected = weekInfo.weekStartYmd === selectedWeekInfo?.weekStartYmd;

                return (
                  <button
                    key={`week-${weekInfo.weekStartYmd}`}
                    type="button"
                    onClick={() => {
                      weekNavDirectionRef.current = 0;
                      setSelectedWeekStartYmd(weekInfo.weekStartYmd);
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition sm:text-sm ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-600/80 text-white"
                        : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span className="block">Week {weekInfo.index + 1}</span>
                    <span className="block text-[10px] text-white/60">
                      {formatWeekRangeLabel(weekInfo.weekStartYmd)}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  if (!canGoNext) return;
                  const next = weekInfos[safeSelectedWeekPosition + 1];
                  if (next) {
                    weekNavDirectionRef.current = 1;
                    setSelectedWeekStartYmd(next.weekStartYmd);
                  }
                }}
                disabled={!canGoNext}
                aria-label="Next week"
                className="rounded-xl border border-white/20 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedWeekStartYmd}
              initial={{
                opacity: 0,
                x: 24 * weekNavDirectionRef.current,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -24 * weekNavDirectionRef.current,
              }}
              transition={{
                duration: 0.2,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="min-w-0"
            >
              <HabitTrackerGrid
                habits={trackerState.monthState.habits}
                week={selectedWeek}
                weekIndex={selectedWeekIndex}
                checksByHabitId={trackerState.monthState.checksByHabitId}
                highlightedHabitId={highlightedHabitId}
                mood={trackerState.monthState.mood}
                motivation={trackerState.monthState.motivation}
                onAddHabit={addHabit}
                onRenameHabit={renameHabit}
                onDeleteHabit={deleteHabit}
                onUpdateGoal={updateGoal}
                onHighlightHabit={setHighlightedHabitId}
                onToggleCheck={toggleCheck}
                onMoodChange={updateMood}
                onMotivationChange={updateMotivation}
                canEditWeek={canEditWeek}
                isDayEditable={isDayEditable}
                perDayProgressPercent={monthMetrics.perDayProgressPercent}
                perDayDone={monthMetrics.perDayDone}
                perDayNotDone={monthMetrics.perDayNotDone}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </SectionCard>
    </div>
  );
}
