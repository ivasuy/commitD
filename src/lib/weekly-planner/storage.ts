import { getLocalNow, isBeforeLocal, toLocalYMD } from "@/src/lib/time/localTime";

export const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

export type DayIndex = (typeof DAY_INDICES)[number];
export type NoteLines = string[];
export type SevenChecks = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

export interface PlannerTask {
  id: string;
  text: string;
  done: boolean;
}

export interface RecurringTask {
  id: string;
  name: string;
  checks: SevenChecks;
}

export interface NotesEntry {
  notes: NoteLines;
  improve: NoteLines;
  thanks: NoteLines;
}

export type TasksByDay = Record<DayIndex, PlannerTask[]>;
export type NotesByDay = Record<DayIndex, NotesEntry>;

export interface WeeklyPlannerData {
  weekStart: string;
  lastOpenedYmd: string;
  quote: string;
  tasksByDay: TasksByDay;
  recurringTasks: RecurringTask[];
  notesByDay: NotesByDay;
}

const STORAGE_PREFIX = "weekly-planner:week:";
const SELECTED_WEEK_KEY = "weekly-planner:selected-week";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function emptyChecks(): SevenChecks {
  return [false, false, false, false, false, false, false];
}

function emptyLines(): NoteLines {
  return ["", "", ""];
}

function emptyNotes(): NotesEntry {
  return {
    notes: emptyLines(),
    improve: emptyLines(),
    thanks: emptyLines(),
  };
}

function normalizeTask(value: unknown): PlannerTask | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : "";
  const text = typeof value.text === "string" ? value.text : "";
  const done = Boolean(value.done);

  if (!id || !text.trim()) {
    return null;
  }

  return {
    id,
    text,
    done,
  };
}

function normalizeNoteLines(value: unknown): NoteLines {
  if (!Array.isArray(value)) {
    return emptyLines();
  }

  const lines = value.map((line) => (typeof line === "string" ? line : ""));

  while (lines.length < 3) {
    lines.push("");
  }

  return lines;
}

function normalizeNotesEntry(value: unknown): NotesEntry {
  if (!isRecord(value)) {
    return emptyNotes();
  }

  return {
    notes: normalizeNoteLines(value.notes),
    improve: normalizeNoteLines(value.improve),
    thanks: normalizeNoteLines(value.thanks),
  };
}

function normalizeChecks(value: unknown): SevenChecks {
  if (!Array.isArray(value)) {
    return emptyChecks();
  }

  return [0, 1, 2, 3, 4, 5, 6].map((index) => Boolean(value[index])) as SevenChecks;
}

function normalizeTasksByDay(value: unknown): TasksByDay {
  const source = isRecord(value) ? value : {};
  const entries = DAY_INDICES.map((dayIndex) => {
    const dayTasks = source[String(dayIndex)];
    const normalizedTasks = Array.isArray(dayTasks)
      ? dayTasks.map(normalizeTask).filter((task): task is PlannerTask => task !== null)
      : [];

    return [dayIndex, normalizedTasks] as const;
  });

  return Object.fromEntries(entries) as TasksByDay;
}

function normalizeNotesByDay(value: unknown): NotesByDay {
  const source = isRecord(value) ? value : {};
  const entries = DAY_INDICES.map((dayIndex) => {
    const dayNotes = source[String(dayIndex)];
    return [dayIndex, normalizeNotesEntry(dayNotes)] as const;
  });

  return Object.fromEntries(entries) as NotesByDay;
}

function normalizeRecurringTasks(value: unknown): RecurringTask[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((task) => {
      if (!isRecord(task)) {
        return null;
      }

      const id = typeof task.id === "string" ? task.id : "";
      const name = typeof task.name === "string" ? task.name : "";

      if (!id || !name.trim()) {
        return null;
      }

      return {
        id,
        name,
        checks: normalizeChecks(task.checks),
      } satisfies RecurringTask;
    })
    .filter((task): task is RecurringTask => task !== null);
}

function weekStorageKey(weekStart: string): string {
  return `${STORAGE_PREFIX}${weekStart}`;
}

export function createDefaultWeekData(
  weekStart: string,
  lastOpenedYmd = weekStart,
): WeeklyPlannerData {
  const tasksByDay = Object.fromEntries(
    DAY_INDICES.map((dayIndex) => [dayIndex, [] as PlannerTask[]]),
  ) as TasksByDay;

  const notesByDay = Object.fromEntries(
    DAY_INDICES.map((dayIndex) => [dayIndex, emptyNotes()]),
  ) as NotesByDay;

  return {
    weekStart,
    lastOpenedYmd,
    quote: "Inspiration comes only during work",
    tasksByDay,
    recurringTasks: [],
    notesByDay,
  };
}

export function normalizeWeekData(
  weekStart: string,
  raw: unknown,
  todayYmd: string,
): WeeklyPlannerData {
  const fallback = createDefaultWeekData(weekStart, todayYmd);

  if (!isRecord(raw)) {
    return fallback;
  }

  const storedLastOpenedYmd =
    typeof raw.lastOpenedYmd === "string" ? raw.lastOpenedYmd : fallback.lastOpenedYmd;

  return {
    weekStart,
    lastOpenedYmd: isBeforeLocal(storedLastOpenedYmd, todayYmd) ? todayYmd : storedLastOpenedYmd,
    quote: typeof raw.quote === "string" ? raw.quote : fallback.quote,
    tasksByDay: normalizeTasksByDay(raw.tasksByDay),
    recurringTasks: normalizeRecurringTasks(raw.recurringTasks),
    notesByDay: normalizeNotesByDay(raw.notesByDay),
  };
}

export function loadWeekData(weekStart: string, todayYmd?: string): WeeklyPlannerData {
  const resolvedTodayYmd =
    todayYmd ??
    (typeof window === "undefined" ? weekStart : toLocalYMD(getLocalNow()));
  const fallback = createDefaultWeekData(weekStart, resolvedTodayYmd);

  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(weekStorageKey(weekStart));

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeWeekData(weekStart, parsed, resolvedTodayYmd);
  } catch {
    return fallback;
  }
}

export function saveWeekData(data: WeeklyPlannerData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(weekStorageKey(data.weekStart), JSON.stringify(data));
  } catch {
    // Ignore write errors for MVP storage.
  }
}

export function loadSelectedWeekStart(defaultValue: string): string {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const stored = window.localStorage.getItem(SELECTED_WEEK_KEY);
  return stored || defaultValue;
}

export function saveSelectedWeekStart(weekStart: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SELECTED_WEEK_KEY, weekStart);
  } catch {
    // Ignore write errors for MVP storage.
  }
}
