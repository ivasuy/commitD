import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { firestore } from "@/src/lib/firebase/client";
import {
  createDefaultWeekData,
  normalizeWeekData,
  type WeeklyPlannerData,
} from "@/src/lib/weekly-planner/storage";
import {
  fromYearMonthKey,
  getDaysInMonth,
  toYearMonthKey,
} from "@/src/lib/date";
import {
  normalizeHabitMonthState,
} from "@/src/lib/habit-tracker/storage";
import type { HabitMonthState } from "@/src/lib/habit-tracker/types";
import type {
  TaskTrackerSettings,
  TaskTrackerTasks,
} from "@/src/lib/task-tracker/types";
import {
  normalizeTaskTrackerSettings,
  normalizeTaskTrackerTasks,
} from "@/src/lib/task-tracker/storage";
import type {
  FinanceMonthState,
  FinanceTrackerSettings,
} from "@/src/lib/finance-tracker/types";
import {
  normalizeFinanceMonthState,
  normalizeFinanceSettings,
} from "@/src/lib/finance-tracker/storage";
import { getLocalNow, toLocalYMD } from "@/src/lib/time/localTime";
import {
  canUseStorage,
  readStorageJSON,
  readStorageString,
  writeStorageJSON,
  writeStorageString,
} from "@/src/lib/storage";

const sessionCache = {
  weeklyPlanner: new Map<string, WeeklyPlannerData>(),
  weeklyPlannerMeta: new Map<string, WeeklyPlannerMeta | null>(),
  habitMonth: new Map<string, HabitMonthState>(),
  habitTrackerMeta: new Map<string, HabitTrackerMeta | null>(),
  taskSettings: new Map<string, TaskTrackerSettings>(),
  taskTasks: new Map<string, TaskTrackerTasks>(),
  financeSettings: new Map<string, FinanceTrackerSettings>(),
  financeMonth: new Map<string, FinanceMonthState>(),
};

interface TimestampLike {
  toDate?: () => Date;
}

export interface WeeklyPlannerMeta {
  firstEntryAt?: unknown;
  firstWeekStart?: string;
}

export interface HabitTrackerMeta {
  firstEntryAt?: unknown;
  firstWeekStart?: string;
  firstMonthKey?: string;
}

function parseTimestamp(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const timestamp = value as TimestampLike;

  if (typeof timestamp.toDate === "function") {
    const parsed = timestamp.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function normalizeWeeklyPlannerMeta(value: unknown): WeeklyPlannerMeta | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const firstWeekStart =
    typeof source.firstWeekStart === "string" ? source.firstWeekStart : undefined;
  const firstEntryAt = source.firstEntryAt;

  if (!firstWeekStart && !parseTimestamp(firstEntryAt)) {
    return null;
  }

  return {
    firstEntryAt: firstEntryAt ?? undefined,
    firstWeekStart,
  };
}

function normalizeHabitTrackerMeta(value: unknown): HabitTrackerMeta | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const firstWeekStart =
    typeof source.firstWeekStart === "string" ? source.firstWeekStart : undefined;
  const firstMonthKey =
    typeof source.firstMonthKey === "string" ? source.firstMonthKey : undefined;
  const firstEntryAt = source.firstEntryAt;

  if (!firstWeekStart && !firstMonthKey && !parseTimestamp(firstEntryAt)) {
    return null;
  }

  return {
    firstEntryAt: firstEntryAt ?? undefined,
    firstWeekStart,
    firstMonthKey,
  };
}

function getHabitWeekStartYmd(anchorDate: Date): string {
  const dayStart = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate(),
  );
  const offset = (dayStart.getDay() - 6 + 7) % 7;

  dayStart.setDate(dayStart.getDate() - offset);
  return toLocalYMD(dayStart);
}

function cacheKey(uid: string, scope: string, key: string): string {
  return `cache:${uid}:${scope}:${key}`;
}

function readCacheJSON<T>(uid: string, scope: string, key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  return readStorageJSON<T | null>(cacheKey(uid, scope, key), null);
}

function writeCacheJSON<T>(uid: string, scope: string, key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }

  writeStorageJSON(cacheKey(uid, scope, key), value);
}

function readCacheString(uid: string, scope: string, key: string, fallback = ""): string {
  if (!canUseStorage()) {
    return fallback;
  }

  return readStorageString(cacheKey(uid, scope, key), fallback);
}

function writeCacheString(uid: string, scope: string, key: string, value: string): void {
  if (!canUseStorage()) {
    return;
  }

  writeStorageString(cacheKey(uid, scope, key), value);
}

function hasMeaningfulNotes(data: WeeklyPlannerData): boolean {
  return Object.values(data.notesByDay).some((entry) =>
    [...entry.notes, ...entry.improve, ...entry.thanks].some((line) => line.trim().length > 0),
  );
}

function hasMeaningfulWeeklyPlannerData(data: WeeklyPlannerData): boolean {
  const hasQuote = data.quote.trim().length > 0;
  const hasTasks = Object.values(data.tasksByDay).some((tasks) => tasks.length > 0);
  const hasRecurringTasks = data.recurringTasks.length > 0;

  return hasQuote || hasTasks || hasRecurringTasks || hasMeaningfulNotes(data);
}

function hasMeaningfulHabitData(data: HabitMonthState): boolean {
  if (data.habits.length > 0) {
    return true;
  }

  const hasCheckedDay = Object.values(data.checksByHabitId).some((checks) =>
    checks.some(Boolean),
  );

  if (hasCheckedDay) {
    return true;
  }

  const hasMood = data.mood.some((value) => Number.isFinite(value) && value >= 1 && value <= 10);
  const hasMotivation = data.motivation.some(
    (value) => Number.isFinite(value) && value >= 1 && value <= 10,
  );

  return hasMood || hasMotivation;
}

export function readCachedWeeklyPlanner(uid: string, weekStart: string): WeeklyPlannerData | null {
  const cacheId = `${uid}:${weekStart}`;
  return sessionCache.weeklyPlanner.get(cacheId) ?? readCacheJSON(uid, "weeklyPlanner", weekStart);
}

export async function loadWeeklyPlanner(
  uid: string,
  weekStart: string,
  todayYmd = weekStart,
): Promise<WeeklyPlannerData> {
  const cacheId = `${uid}:${weekStart}`;
  const cached = sessionCache.weeklyPlanner.get(cacheId);

  if (cached) {
    return cached;
  }

  const cachedLocal = readCacheJSON<WeeklyPlannerData>(uid, "weeklyPlanner", weekStart);
  const fallback = cachedLocal ?? createDefaultWeekData(weekStart, todayYmd);

  try {
    const ref = doc(firestore, "users", uid, "weeklyPlanner", weekStart);
    const snap = await getDoc(ref);
    const data = snap.exists()
      ? normalizeWeekData(weekStart, snap.data(), todayYmd)
      : fallback;

    sessionCache.weeklyPlanner.set(cacheId, data);
    writeCacheJSON(uid, "weeklyPlanner", weekStart, data);
    return data;
  } catch {
    sessionCache.weeklyPlanner.set(cacheId, fallback);
    return fallback;
  }
}

export async function saveWeeklyPlanner(
  uid: string,
  weekStart: string,
  data: WeeklyPlannerData,
): Promise<void> {
  const cacheId = `${uid}:${weekStart}`;

  sessionCache.weeklyPlanner.set(cacheId, data);
  writeCacheJSON(uid, "weeklyPlanner", weekStart, data);

  const ref = doc(firestore, "users", uid, "weeklyPlanner", weekStart);
  await setDoc(
    ref,
    {
      weekStart,
      quote: data.quote,
      tasksByDay: data.tasksByDay,
      recurringTasks: data.recurringTasks,
      notesByDay: data.notesByDay,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (hasMeaningfulWeeklyPlannerData(data)) {
    await ensureWeeklyPlannerMeta(uid, {
      firstWeekStart: weekStart,
      firstEntryAt: new Date(),
    });
  }
}

export function readSelectedWeekStart(uid: string, fallback: string): string {
  return readCacheString(uid, "weeklyPlanner", "selected-week", fallback);
}

export function saveSelectedWeekStart(uid: string, weekStart: string): void {
  writeCacheString(uid, "weeklyPlanner", "selected-week", weekStart);
}

export async function loadWeeklyPlannerMeta(uid: string): Promise<WeeklyPlannerMeta | null> {
  if (sessionCache.weeklyPlannerMeta.has(uid)) {
    return sessionCache.weeklyPlannerMeta.get(uid) ?? null;
  }

  try {
    const ref = doc(firestore, "users", uid, "weeklyPlanner", "meta");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      sessionCache.weeklyPlannerMeta.set(uid, null);
      return null;
    }

    const meta = normalizeWeeklyPlannerMeta(snap.data());
    sessionCache.weeklyPlannerMeta.set(uid, meta);
    return meta;
  } catch {
    return sessionCache.weeklyPlannerMeta.get(uid) ?? null;
  }
}

export async function ensureWeeklyPlannerMeta(
  uid: string,
  input: {
    firstWeekStart: string;
    firstEntryAt?: Date;
  },
): Promise<WeeklyPlannerMeta> {
  const ref = doc(firestore, "users", uid, "weeklyPlanner", "meta");
  const existing = await loadWeeklyPlannerMeta(uid);
  const patch: Record<string, unknown> = {};

  if (!parseTimestamp(existing?.firstEntryAt)) {
    patch.firstEntryAt = serverTimestamp();
  }

  if (!existing?.firstWeekStart) {
    patch.firstWeekStart = input.firstWeekStart;
  }

  if (Object.keys(patch).length > 0) {
    await setDoc(ref, patch, { merge: true });
  }

  const merged: WeeklyPlannerMeta = {
    firstEntryAt: existing?.firstEntryAt ?? input.firstEntryAt ?? new Date(),
    firstWeekStart: existing?.firstWeekStart ?? input.firstWeekStart,
  };

  sessionCache.weeklyPlannerMeta.set(uid, merged);
  return merged;
}

export function readCachedHabitMonth(uid: string, monthKey: string): HabitMonthState | null {
  const cacheId = `${uid}:${monthKey}`;
  return sessionCache.habitMonth.get(cacheId) ?? readCacheJSON(uid, "habitTracker", monthKey);
}

export async function loadHabitMonth(
  uid: string,
  monthKey: string,
): Promise<HabitMonthState> {
  const cacheId = `${uid}:${monthKey}`;
  const cached = sessionCache.habitMonth.get(cacheId);

  if (cached) {
    return cached;
  }

  const parsed = fromYearMonthKey(monthKey) ?? { year: 1970, monthIndex: 0 };
  const daysInMonth = getDaysInMonth(parsed.year, parsed.monthIndex);
  const cachedLocal = readCacheJSON<HabitMonthState>(uid, "habitTracker", monthKey);
  const fallback = cachedLocal ?? normalizeHabitMonthState({}, daysInMonth, false);

  try {
    const ref = doc(firestore, "users", uid, "habitTracker", monthKey);
    const snap = await getDoc(ref);
    const data = snap.exists()
      ? normalizeHabitMonthState(snap.data(), daysInMonth, false)
      : fallback;

    sessionCache.habitMonth.set(cacheId, data);
    writeCacheJSON(uid, "habitTracker", monthKey, data);
    return data;
  } catch {
    sessionCache.habitMonth.set(cacheId, fallback);
    return fallback;
  }
}

export async function saveHabitMonth(
  uid: string,
  monthKey: string,
  data: HabitMonthState,
): Promise<void> {
  const parsed = fromYearMonthKey(monthKey) ?? { year: 1970, monthIndex: 0 };
  const daysInMonth = getDaysInMonth(parsed.year, parsed.monthIndex);
  const normalized = normalizeHabitMonthState(data, daysInMonth, false);
  const cacheId = `${uid}:${monthKey}`;
  sessionCache.habitMonth.set(cacheId, normalized);
  writeCacheJSON(uid, "habitTracker", monthKey, normalized);

  const ref = doc(firestore, "users", uid, "habitTracker", monthKey);
  await setDoc(
    ref,
    {
      monthKey,
      habits: normalized.habits,
      checksByHabitId: normalized.checksByHabitId,
      mood: normalized.mood,
      motivation: normalized.motivation,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (hasMeaningfulHabitData(normalized)) {
    await ensureHabitTrackerMeta(uid, {
      firstWeekStart: getHabitWeekStartYmd(getLocalNow()),
      firstMonthKey: monthKey,
      firstEntryAt: new Date(),
    });
  }
}

export function readSelectedHabitMonth(uid: string, fallback: string): string {
  return readCacheString(uid, "habitTracker", "selected-month", fallback);
}

export function saveSelectedHabitMonth(uid: string, monthKey: string): void {
  writeCacheString(uid, "habitTracker", "selected-month", monthKey);
}

export async function loadHabitTrackerMeta(uid: string): Promise<HabitTrackerMeta | null> {
  if (sessionCache.habitTrackerMeta.has(uid)) {
    return sessionCache.habitTrackerMeta.get(uid) ?? null;
  }

  try {
    const ref = doc(firestore, "users", uid, "habitTracker", "meta");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      sessionCache.habitTrackerMeta.set(uid, null);
      return null;
    }

    const meta = normalizeHabitTrackerMeta(snap.data());
    sessionCache.habitTrackerMeta.set(uid, meta);
    return meta;
  } catch {
    return sessionCache.habitTrackerMeta.get(uid) ?? null;
  }
}

export async function ensureHabitTrackerMeta(
  uid: string,
  input: {
    firstWeekStart: string;
    firstMonthKey: string;
    firstEntryAt?: Date;
  },
): Promise<HabitTrackerMeta> {
  const ref = doc(firestore, "users", uid, "habitTracker", "meta");
  const existing = await loadHabitTrackerMeta(uid);
  const patch: Record<string, unknown> = {};

  if (!parseTimestamp(existing?.firstEntryAt)) {
    patch.firstEntryAt = serverTimestamp();
  }

  if (!existing?.firstWeekStart) {
    patch.firstWeekStart = input.firstWeekStart;
  }

  if (!existing?.firstMonthKey) {
    patch.firstMonthKey = input.firstMonthKey;
  }

  if (Object.keys(patch).length > 0) {
    await setDoc(ref, patch, { merge: true });
  }

  const merged: HabitTrackerMeta = {
    firstEntryAt: existing?.firstEntryAt ?? input.firstEntryAt ?? new Date(),
    firstWeekStart: existing?.firstWeekStart ?? input.firstWeekStart,
    firstMonthKey: existing?.firstMonthKey ?? input.firstMonthKey,
  };

  sessionCache.habitTrackerMeta.set(uid, merged);
  return merged;
}

export function readCachedTaskTracker(uid: string): {
  settings: TaskTrackerSettings | null;
  tasks: TaskTrackerTasks | null;
} {
  return {
    settings:
      sessionCache.taskSettings.get(uid) ?? readCacheJSON(uid, "taskTracker", "meta"),
    tasks: sessionCache.taskTasks.get(uid) ?? readCacheJSON(uid, "taskTracker", "data"),
  };
}

export async function loadTaskTracker(uid: string): Promise<{
  settings: TaskTrackerSettings;
  tasks: TaskTrackerTasks;
}> {
  const cachedSettings = sessionCache.taskSettings.get(uid);
  const cachedTasks = sessionCache.taskTasks.get(uid);

  if (cachedSettings && cachedTasks) {
    return { settings: cachedSettings, tasks: cachedTasks };
  }

  const cachedLocalSettings = readCacheJSON<TaskTrackerSettings>(uid, "taskTracker", "meta");
  const cachedLocalTasks = readCacheJSON<TaskTrackerTasks>(uid, "taskTracker", "data");

  try {
    const [settingsSnap, tasksSnap] = await Promise.all([
      getDoc(doc(firestore, "users", uid, "taskTracker", "meta")),
      getDoc(doc(firestore, "users", uid, "taskTracker", "data")),
    ]);

    const settings = settingsSnap.exists()
      ? normalizeTaskTrackerSettings(settingsSnap.data())
      : normalizeTaskTrackerSettings(cachedLocalSettings ?? {});

    const tasks = tasksSnap.exists()
      ? normalizeTaskTrackerTasks(tasksSnap.data(), settings.categories)
      : normalizeTaskTrackerTasks(cachedLocalTasks ?? {}, settings.categories);

    sessionCache.taskSettings.set(uid, settings);
    sessionCache.taskTasks.set(uid, tasks);
    writeCacheJSON(uid, "taskTracker", "meta", settings);
    writeCacheJSON(uid, "taskTracker", "data", tasks);

    return { settings, tasks };
  } catch {
    const settings = normalizeTaskTrackerSettings(cachedLocalSettings ?? {});
    const tasks = normalizeTaskTrackerTasks(cachedLocalTasks ?? {}, settings.categories);

    sessionCache.taskSettings.set(uid, settings);
    sessionCache.taskTasks.set(uid, tasks);

    return { settings, tasks };
  }
}

export async function saveTaskTracker(
  uid: string,
  tasks: TaskTrackerTasks,
  settings: TaskTrackerSettings,
): Promise<void> {
  sessionCache.taskSettings.set(uid, settings);
  sessionCache.taskTasks.set(uid, tasks);
  writeCacheJSON(uid, "taskTracker", "meta", settings);
  writeCacheJSON(uid, "taskTracker", "data", tasks);

  await Promise.all([
    setDoc(
      doc(firestore, "users", uid, "taskTracker", "meta"),
      {
        categories: settings.categories,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
    setDoc(
      doc(firestore, "users", uid, "taskTracker", "data"),
      {
        tasks: tasks.tasks,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
  ]);
}

export function readTaskFilters(uid: string): Record<string, string> | null {
  return readCacheJSON<Record<string, string>>(uid, "taskTracker", "filters");
}

export function saveTaskFilters(uid: string, filters: Record<string, string>): void {
  writeCacheJSON(uid, "taskTracker", "filters", filters);
}

export function readCachedFinanceSettings(uid: string): FinanceTrackerSettings | null {
  return sessionCache.financeSettings.get(uid) ?? readCacheJSON(uid, "financeTracker", "settings");
}

export async function loadFinanceSettings(uid: string): Promise<FinanceTrackerSettings> {
  const cached = sessionCache.financeSettings.get(uid);
  if (cached) {
    return cached;
  }

  const cachedLocal = readCacheJSON<FinanceTrackerSettings>(uid, "financeTracker", "settings");

  try {
    const ref = doc(firestore, "users", uid, "financeTracker", "settings");
    const snap = await getDoc(ref);
    const settings = snap.exists()
      ? normalizeFinanceSettings(snap.data())
      : normalizeFinanceSettings(cachedLocal ?? {});

    sessionCache.financeSettings.set(uid, settings);
    writeCacheJSON(uid, "financeTracker", "settings", settings);
    return settings;
  } catch {
    const settings = normalizeFinanceSettings(cachedLocal ?? {});
    sessionCache.financeSettings.set(uid, settings);
    return settings;
  }
}

export async function saveFinanceSettings(
  uid: string,
  settings: FinanceTrackerSettings,
): Promise<void> {
  sessionCache.financeSettings.set(uid, settings);
  writeCacheJSON(uid, "financeTracker", "settings", settings);

  await setDoc(
    doc(firestore, "users", uid, "financeTracker", "settings"),
    {
      incomeSources: settings.incomeSources,
      expenseCategories: settings.expenseCategories,
      debtSources: settings.debtSources,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function readCachedFinanceMonth(uid: string, monthKey: string): FinanceMonthState | null {
  const cacheId = `${uid}:${monthKey}`;
  return sessionCache.financeMonth.get(cacheId) ?? readCacheJSON(uid, "financeTracker", monthKey);
}

export async function loadFinanceMonth(
  uid: string,
  monthKey: string,
  settings: FinanceTrackerSettings,
): Promise<FinanceMonthState> {
  const cacheId = `${uid}:${monthKey}`;
  const cached = sessionCache.financeMonth.get(cacheId);

  if (cached) {
    return cached;
  }

  const cachedLocal = readCacheJSON<FinanceMonthState>(uid, "financeTracker", monthKey);
  const fallback = normalizeFinanceMonthState(monthKey, cachedLocal ?? {}, settings);

  try {
    const ref = doc(firestore, "users", uid, "financeTracker", monthKey);
    const snap = await getDoc(ref);
    const data = snap.exists()
      ? normalizeFinanceMonthState(monthKey, snap.data(), settings)
      : fallback;

    sessionCache.financeMonth.set(cacheId, data);
    writeCacheJSON(uid, "financeTracker", monthKey, data);
    return data;
  } catch {
    sessionCache.financeMonth.set(cacheId, fallback);
    return fallback;
  }
}

export async function loadFinanceMonthIfExists(
  uid: string,
  monthKey: string,
  settings: FinanceTrackerSettings,
): Promise<FinanceMonthState | null> {
  const cacheId = `${uid}:${monthKey}`;
  const cached = sessionCache.financeMonth.get(cacheId);

  if (cached) {
    return cached;
  }

  const cachedLocal = readCacheJSON<FinanceMonthState>(uid, "financeTracker", monthKey);

  try {
    const ref = doc(firestore, "users", uid, "financeTracker", monthKey);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return cachedLocal ? normalizeFinanceMonthState(monthKey, cachedLocal, settings) : null;
    }

    const data = normalizeFinanceMonthState(monthKey, snap.data(), settings);
    sessionCache.financeMonth.set(cacheId, data);
    writeCacheJSON(uid, "financeTracker", monthKey, data);
    return data;
  } catch {
    return cachedLocal ? normalizeFinanceMonthState(monthKey, cachedLocal, settings) : null;
  }
}

export async function saveFinanceMonth(
  uid: string,
  monthKey: string,
  data: FinanceMonthState,
): Promise<void> {
  const cacheId = `${uid}:${monthKey}`;
  sessionCache.financeMonth.set(cacheId, data);
  writeCacheJSON(uid, "financeTracker", monthKey, data);

  await setDoc(
    doc(firestore, "users", uid, "financeTracker", monthKey),
    {
      monthKey,
      startingAmount: data.startingAmount,
      plannedIncome: data.plannedIncome,
      plannedExpenses: data.plannedExpenses,
      debts: data.debts,
      dailyIncome: data.dailyIncome,
      dailyExpenses: data.dailyExpenses,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function readSelectedFinanceMonth(uid: string, fallback: string): string {
  return readCacheString(uid, "financeTracker", "selected-month", fallback);
}

export function saveSelectedFinanceMonth(uid: string, monthKey: string): void {
  writeCacheString(uid, "financeTracker", "selected-month", monthKey);
}

export function getMonthKeyFromSelection(year: number, monthIndex: number): string {
  return toYearMonthKey(year, monthIndex);
}
