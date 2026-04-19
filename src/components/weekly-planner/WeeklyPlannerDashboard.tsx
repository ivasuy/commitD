"use client";

import { useEffect, useMemo, useState } from "react";

import SectionCard from "@/src/components/layout/SectionCard";
import NotesPanel from "@/src/components/weekly-planner/NotesPanel";
import RecurringTasksTable from "@/src/components/weekly-planner/RecurringTasksTable";
import WeeklyPlanner from "@/src/components/weekly-planner/WeeklyPlanner";
import { useAuth } from "@/src/hooks/useAuth";
import { useLocalToday } from "@/src/hooks/useLocalToday";
import { useSaveOnBlur } from "@/src/hooks/useSaveOnBlur";
import {
  ensureWeeklyPlannerMeta,
  loadWeeklyPlanner,
  loadWeeklyPlannerMeta,
  readCachedWeeklyPlanner,
  saveSelectedWeekStart,
  saveWeeklyPlanner,
  type WeeklyPlannerMeta,
} from "@/src/lib/db/store";
import {
  getFirstEntryDate,
  isBeforeFirstEntry,
  isWeekBeforeFirstEntry,
} from "@/src/lib/date/firstEntryWindow";
import { debounce } from "@/src/lib/storage";
import {
  addDaysLocal,
  isBeforeLocal,
  parseLocalYMD,
  toLocalYMD,
} from "@/src/lib/time/localTime";
import { getWeekDays } from "@/src/lib/weekly-planner/date";
import { calculateWeeklyMetrics } from "@/src/lib/weekly-planner/metrics";
import {
  createDefaultWeekData,
  type DayIndex,
  type NoteLines,
  type SevenChecks,
  type WeeklyPlannerData,
} from "@/src/lib/weekly-planner/storage";

type NoteSection = "notes" | "improve" | "thanks";
type NoteLineIndex = number;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getWeekStartYmd(ymd: string): string {
  const parsed = parseLocalYMD(ymd);
  const mondayOffset = (parsed.getDay() + 6) % 7;
  return addDaysLocal(ymd, -mondayOffset);
}

function addWeeks(weekStartYmd: string, weekOffset: number): string {
  return addDaysLocal(weekStartYmd, weekOffset * 7);
}

function getMonthBounds(monthKeyYm: string): { monthStartYmd: string; monthEndYmd: string } {
  const monthStartYmd = `${monthKeyYm}-01`;
  const monthStartDate = parseLocalYMD(monthStartYmd);
  const monthEndDate = new Date(
    monthStartDate.getFullYear(),
    monthStartDate.getMonth() + 1,
    0,
  );

  return {
    monthStartYmd,
    monthEndYmd: toLocalYMD(monthEndDate),
  };
}

function clampWeekStart(weekStartYmd: string, earliestWeekStart: string, latestWeekStart: string): string {
  if (isBeforeLocal(weekStartYmd, earliestWeekStart)) {
    return earliestWeekStart;
  }

  if (isBeforeLocal(latestWeekStart, weekStartYmd)) {
    return latestWeekStart;
  }

  return weekStartYmd;
}

function buildMonthWeekStarts(monthStartYmd: string, monthEndYmd: string): string[] {
  const weeks: string[] = [];
  let current = getWeekStartYmd(monthStartYmd);

  while (!isBeforeLocal(monthEndYmd, current)) {
    weeks.push(current);
    current = addWeeks(current, 1);
  }

  return weeks;
}

function updateNoteLines(lines: NoteLines, lineIndex: number, value: string): NoteLines {
  const nextLines = lines.map((line, index) => (index === lineIndex ? value : line));

  if (lineIndex === nextLines.length - 1 && value.trim()) {
    nextLines.push("");
  }

  return nextLines;
}

function deleteNoteLine(lines: NoteLines, lineIndex: number): NoteLines {
  if (lines.length > 3) {
    return lines.filter((_, index) => index !== lineIndex);
  }

  return lines.map((line, index) => (index === lineIndex ? "" : line));
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

function getVisibleDayIndices(weekStart: string, firstEntryDay: Date | null): DayIndex[] {
  const weekDays = getWeekDays(weekStart);

  if (!firstEntryDay) {
    return weekDays.map((day) => day.index);
  }

  return weekDays
    .filter((day) => !isBeforeFirstEntry(day.date, firstEntryDay))
    .map((day) => day.index);
}

function getDefaultSelectedDay(
  weekStart: string,
  todayYmd: string,
  firstEntryDay: Date | null,
): DayIndex {
  const visibleDayIndices = getVisibleDayIndices(weekStart, firstEntryDay);

  if (!visibleDayIndices.length) {
    return 0;
  }

  const weekDays = getWeekDays(weekStart);
  const todayDay = weekDays.find((day) => day.isoDate === todayYmd);

  if (todayDay && visibleDayIndices.includes(todayDay.index)) {
    return todayDay.index;
  }

  return visibleDayIndices[0];
}

function getDefaultSelectedDayForData(
  data: WeeklyPlannerData,
  todayYmd: string,
  metaFirstEntryDay: Date | null,
): DayIndex {
  return getDefaultSelectedDay(
    data.weekStart,
    todayYmd,
    resolveWeekFirstEntryDay(data, metaFirstEntryDay),
  );
}

export default function WeeklyPlannerDashboard() {
  const { todayYmd, monthKeyYm } = useLocalToday();
  const { user } = useAuth();

  const currentWeekStart = useMemo(() => getWeekStartYmd(todayYmd), [todayYmd]);
  const { monthStartYmd, monthEndYmd } = useMemo(
    () => getMonthBounds(monthKeyYm),
    [monthKeyYm],
  );

  const [plannerData, setPlannerData] = useState<WeeklyPlannerData>(() =>
    createDefaultWeekData(currentWeekStart, todayYmd),
  );
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [selectedDay, setSelectedDay] = useState<DayIndex>(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [meta, setMeta] = useState<WeeklyPlannerMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // References:
  // /Users/vasuyadav/Desktop/Screenshot 2026-02-18 at 7.03.51 PM.png
  // /Users/vasuyadav/Desktop/Screenshot 2026-02-18 at 7.04.34 PM.png
  // /Users/vasuyadav/Desktop/Screenshot 2026-02-18 at 7.04.24 PM.png
  // Weekly window is tool-meta bounded, never before first entry.
  const firstEntryDay = useMemo(
    () => resolveFirstEntryDay(meta, currentWeekStart),
    [meta, currentWeekStart],
  );

  const earliestWeekStart = useMemo(() => {
    if (!meta?.firstWeekStart) {
      return null;
    }

    return getWeekStartYmd(meta.firstWeekStart);
  }, [meta]);

  const weekStarts = useMemo(() => {
    const monthWeekStarts = buildMonthWeekStarts(monthStartYmd, monthEndYmd);

    if (!monthWeekStarts.length || !firstEntryDay) {
      return monthWeekStarts;
    }

    const filtered = monthWeekStarts.filter(
      (weekStart) => !isWeekBeforeFirstEntry(weekStart, firstEntryDay),
    );

    if (filtered.length) {
      return filtered;
    }

    if (!earliestWeekStart) {
      return [];
    }

    return monthWeekStarts.filter((weekStart) => !isBeforeLocal(weekStart, earliestWeekStart));
  }, [earliestWeekStart, firstEntryDay, monthStartYmd, monthEndYmd]);

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

      const loadedMeta = await loadWeeklyPlannerMeta(user.uid);

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

  useEffect(() => {
    if (!weekStarts.length) {
      return;
    }

    const clamped = clampWeekStart(
      selectedWeekStart,
      weekStarts[0],
      weekStarts[weekStarts.length - 1],
    );

    if (clamped !== selectedWeekStart) {
      setSelectedWeekStart(clamped);
    }
  }, [selectedWeekStart, weekStarts]);

  useEffect(() => {
    let ignore = false;

    void Promise.resolve().then(async () => {
      if (!user || !weekStarts.length) {
        if (ignore) {
          return;
        }

        setPlannerData(createDefaultWeekData(currentWeekStart, todayYmd));
        setSelectedDay(0);
        setIsHydrated(false);
        return;
      }

      const clampedWeekStart = clampWeekStart(
        selectedWeekStart,
        weekStarts[0],
        weekStarts[weekStarts.length - 1],
      );

      const cached = readCachedWeeklyPlanner(user.uid, clampedWeekStart);
      const cachedData = cached ?? createDefaultWeekData(clampedWeekStart, todayYmd);

      setPlannerData(cachedData);
      setSelectedDay(getDefaultSelectedDayForData(cachedData, todayYmd, firstEntryDay));
      setIsHydrated(true);

      const loaded = await loadWeeklyPlanner(user.uid, clampedWeekStart, todayYmd);

      if (ignore) {
        return;
      }

      setPlannerData(loaded);
      setSelectedDay(getDefaultSelectedDayForData(loaded, todayYmd, firstEntryDay));
      setIsHydrated(true);
    });

    return () => {
      ignore = true;
    };
  }, [user, currentWeekStart, selectedWeekStart, todayYmd, weekStarts, firstEntryDay]);

  useEffect(() => {
    setPlannerData((previous) => {
      if (!isBeforeLocal(previous.lastOpenedYmd, todayYmd)) {
        return previous;
      }

      return {
        ...previous,
        lastOpenedYmd: todayYmd,
      };
    });
  }, [todayYmd]);

  const weekDays = useMemo(
    () => getWeekDays(plannerData.weekStart),
    [plannerData.weekStart],
  );

  const weekFirstEntryDay = useMemo(
    () => resolveWeekFirstEntryDay(plannerData, firstEntryDay),
    [plannerData, firstEntryDay],
  );

  const visibleWeekDays = useMemo(() => {
    if (!weekFirstEntryDay) {
      return weekDays;
    }

    return weekDays.filter((day) => !isBeforeFirstEntry(day.date, weekFirstEntryDay));
  }, [weekDays, weekFirstEntryDay]);

  useEffect(() => {
    if (!visibleWeekDays.length) {
      return;
    }

    const selectedIsVisible = visibleWeekDays.some((day) => day.index === selectedDay);

    if (selectedIsVisible) {
      return;
    }

    setSelectedDay(visibleWeekDays[0].index);
  }, [visibleWeekDays, selectedDay]);

  const debouncedSave = useMemo(
    () =>
      debounce((data: WeeklyPlannerData) => {
        if (!user) {
          return;
        }

        void saveWeeklyPlanner(user.uid, data.weekStart, data);
        saveSelectedWeekStart(user.uid, data.weekStart);
      }, 900),
    [user],
  );

  const canEditWeek = useMemo(() => {
    if (!earliestWeekStart) {
      return false;
    }

    return !isBeforeLocal(plannerData.weekStart, currentWeekStart);
  }, [plannerData.weekStart, currentWeekStart, earliestWeekStart]);

  const isDayEditable = (dayIndex: DayIndex): boolean => {
    if (!canEditWeek) {
      return false;
    }

    const day = weekDays[dayIndex];

    if (!day) {
      return false;
    }

    const isVisibleDay = visibleWeekDays.some((visibleDay) => visibleDay.index === dayIndex);

    if (!isVisibleDay) {
      return false;
    }

    return !isBeforeLocal(day.isoDate, todayYmd);
  };

  useEffect(() => {
    if (!user || !isHydrated || !canEditWeek) {
      return;
    }

    debouncedSave(plannerData);

    return () => {
      debouncedSave.cancel();
    };
  }, [plannerData, debouncedSave, user, isHydrated, canEditWeek]);

  useSaveOnBlur(() => {
    if (canEditWeek) {
      debouncedSave.flush();
    }
  });

  const metrics = useMemo(() => calculateWeeklyMetrics(plannerData), [plannerData]);

  const handleWeekStartChange = (weekStartInput: string) => {
    if (!weekStarts.length) {
      return;
    }

    const normalizedWeekStart = getWeekStartYmd(weekStartInput);
    const clampedWeekStart = clampWeekStart(
      normalizedWeekStart,
      weekStarts[0],
      weekStarts[weekStarts.length - 1],
    );

    setSelectedWeekStart(clampedWeekStart);
  };

  const handleStartPlanning = async () => {
    if (!user) {
      return;
    }

    setIsStarting(true);

    const starterWeek = {
      ...createDefaultWeekData(currentWeekStart, todayYmd),
      quote: "",
    } satisfies WeeklyPlannerData;

    try {
      await saveWeeklyPlanner(user.uid, currentWeekStart, starterWeek);
      const nextMeta = await ensureWeeklyPlannerMeta(user.uid, {
        firstWeekStart: currentWeekStart,
        firstEntryAt: new Date(),
      });

      saveSelectedWeekStart(user.uid, currentWeekStart);
      setMeta(nextMeta);
      setSelectedWeekStart(currentWeekStart);
      setPlannerData(starterWeek);
      setSelectedDay(
        getDefaultSelectedDayForData(
          starterWeek,
          todayYmd,
          resolveFirstEntryDay(nextMeta, currentWeekStart),
        ),
      );
      setIsHydrated(true);
    } finally {
      setIsStarting(false);
    }
  };

  const handleQuoteChange = (quote: string) => {
    if (!canEditWeek) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      quote,
    }));
  };

  const handleAddTask = (dayIndex: DayIndex, text: string) => {
    if (!isDayEditable(dayIndex)) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      tasksByDay: {
        ...previous.tasksByDay,
        [dayIndex]: [
          ...previous.tasksByDay[dayIndex],
          {
            id: createId(),
            text,
            done: false,
          },
        ],
      },
    }));
  };

  const handleToggleTask = (dayIndex: DayIndex, taskId: string) => {
    if (!isDayEditable(dayIndex)) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      tasksByDay: {
        ...previous.tasksByDay,
        [dayIndex]: previous.tasksByDay[dayIndex].map((task) =>
          task.id === taskId
            ? {
                ...task,
                done: !task.done,
              }
            : task,
        ),
      },
    }));
  };

  const handleRemoveTask = (dayIndex: DayIndex, taskId: string) => {
    if (!isDayEditable(dayIndex)) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      tasksByDay: {
        ...previous.tasksByDay,
        [dayIndex]: previous.tasksByDay[dayIndex].filter((task) => task.id !== taskId),
      },
    }));
  };

  const handleAddRecurringTask = (taskName: string) => {
    if (!canEditWeek) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      recurringTasks: [
        ...previous.recurringTasks,
        {
          id: createId(),
          name: taskName,
          checks: [false, false, false, false, false, false, false],
        },
      ],
    }));
  };

  const handleRenameRecurringTask = (taskId: string, taskName: string) => {
    if (!canEditWeek) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      recurringTasks: previous.recurringTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              name: taskName,
            }
          : task,
      ),
    }));
  };

  const handleToggleRecurringCheck = (taskId: string, dayIndex: DayIndex) => {
    if (!isDayEditable(dayIndex)) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      recurringTasks: previous.recurringTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const checks = task.checks.map((checked, index) =>
          index === dayIndex ? !checked : checked,
        ) as SevenChecks;

        return {
          ...task,
          checks,
        };
      }),
    }));
  };

  const handleRemoveRecurringTask = (taskId: string) => {
    if (!canEditWeek) {
      return;
    }

    setPlannerData((previous) => ({
      ...previous,
      recurringTasks: previous.recurringTasks.filter((task) => task.id !== taskId),
    }));
  };

  const handleUpdateNoteLine = (
    dayIndex: DayIndex,
    section: NoteSection,
    lineIndex: NoteLineIndex,
    value: string,
  ) => {
    if (!isDayEditable(dayIndex)) {
      return;
    }

    setPlannerData((previous) => {
      const dayEntry = previous.notesByDay[dayIndex];
      const updatedLines = updateNoteLines(dayEntry[section], lineIndex, value);

      return {
        ...previous,
        notesByDay: {
          ...previous.notesByDay,
          [dayIndex]: {
            ...dayEntry,
            [section]: updatedLines,
          },
        },
      };
    });
  };

  const handleDeleteNoteLine = (
    dayIndex: DayIndex,
    section: NoteSection,
    lineIndex: NoteLineIndex,
  ) => {
    if (!isDayEditable(dayIndex)) {
      return;
    }

    setPlannerData((previous) => {
      const dayEntry = previous.notesByDay[dayIndex];

      return {
        ...previous,
        notesByDay: {
          ...previous.notesByDay,
          [dayIndex]: {
            ...dayEntry,
            [section]: deleteNoteLine(dayEntry[section], lineIndex),
          },
        },
      };
    });
  };

  if (metaLoading) {
    return (
      <SectionCard>
        <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-white/70">
          Loading planner window...
        </div>
      </SectionCard>
    );
  }

  if (!meta) {
    return (
      <SectionCard>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-semibold text-white">Start planning your week</h2>
          <p className="max-w-xl text-sm text-white/70">
            Create your first weekly entry to unlock week navigation.
          </p>
          <button
            type="button"
            onClick={handleStartPlanning}
            disabled={isStarting || !user}
            className="rounded-xl border border-emerald-400/60 bg-emerald-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? "Creating..." : "Create first week (today)"}
          </button>
        </div>
      </SectionCard>
    );
  }

  const selectedDayMetric = metrics.dayMetrics[selectedDay];

  return (
    <SectionCard>
      <div className="flex w-full min-w-0 flex-col space-y-6 md:space-y-8">
        <WeeklyPlanner
          weekStart={plannerData.weekStart}
          weekStarts={weekStarts}
          onWeekStartChange={handleWeekStartChange}
          quote={plannerData.quote}
          onQuoteChange={handleQuoteChange}
          weekDays={visibleWeekDays}
          tasksByDay={plannerData.tasksByDay}
          selectedDay={selectedDay}
          selectedDayMetric={selectedDayMetric}
          onSelectDay={setSelectedDay}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onRemoveTask={handleRemoveTask}
          isDayEditable={isDayEditable}
          canEditWeek={canEditWeek}
        />

        <div className="w-full min-w-0">
          <RecurringTasksTable
            weekDays={visibleWeekDays}
            recurringMetrics={metrics.recurring}
            onAddTask={handleAddRecurringTask}
            onRenameTask={handleRenameRecurringTask}
            onToggleCheck={handleToggleRecurringCheck}
            onRemoveTask={handleRemoveRecurringTask}
            canEditWeek={canEditWeek}
            isDayEditable={isDayEditable}
          />
        </div>

        <NotesPanel
          weekDays={visibleWeekDays}
          selectedDay={selectedDay}
          notesByDay={plannerData.notesByDay}
          onSelectDay={setSelectedDay}
          onUpdateLine={handleUpdateNoteLine}
          onDeleteLine={handleDeleteNoteLine}
          isDayEditable={isDayEditable}
        />
      </div>
    </SectionCard>
  );
}
