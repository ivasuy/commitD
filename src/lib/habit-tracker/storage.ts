import {
  fromYearMonthKey,
  getDaysInMonth,
  getCurrentMonthSelection,
  toYearMonthKey,
  type MonthSelection,
} from "@/src/lib/date";
import {
  listStorageKeys,
  readRawStorageItem,
  readStorageJSON,
  readStorageString,
  writeStorageJSON,
  writeStorageString,
} from "@/src/lib/storage";

import type {
  Habit,
  HabitMonthState,
  YearlyStatisticsCache,
} from "@/src/lib/habit-tracker/types";

const MONTH_PREFIX = "habit-tracker:";
const YEAR_PREFIX = "habit-tracker-year:";
const SELECTED_MONTH_KEY = "habit-tracker:selected-month";

const SAMPLE_HABITS = [
  "Wake up at 05:00 ⏰",
  "Gym 💪",
  "Reading / Learning 📖",
  "Day Planning 🗓️",
  "Budget Tracking 💰",
  "Project Work 🎯",
  "No Alcohol 🍾",
  "Social Media Detox 🌿",
  "Goal Journaling 📔",
  "Cold Shower 🚿",
];

function createHabitId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeGoal(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  const rounded = Math.round(value);

  if (rounded <= 0) {
    return undefined;
  }

  return rounded;
}

function normalizeMoodValue(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  const rounded = Math.round(value);
  return Math.min(10, Math.max(0, rounded));
}

function ensureBooleanArray(values: unknown, length: number): boolean[] {
  if (!Array.isArray(values)) {
    return Array.from({ length }, () => false);
  }

  return Array.from({ length }, (_, index) => Boolean(values[index]));
}

function ensureScoreArray(values: unknown, length: number): number[] {
  if (!Array.isArray(values)) {
    return Array.from({ length }, () => 0);
  }

  return Array.from({ length }, (_, index) => normalizeMoodValue(values[index]));
}

function normalizeHabits(values: unknown, includeSamplesWhenEmpty: boolean): Habit[] {
  if (!Array.isArray(values)) {
    return includeSamplesWhenEmpty
      ? SAMPLE_HABITS.map((name) => ({
          id: createHabitId(),
          name,
        }))
      : [];
  }

  const habits = values
    .map((value): Habit | null => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const source = value as Record<string, unknown>;
      const id = typeof source.id === "string" ? source.id : createHabitId();
      const name = typeof source.name === "string" ? source.name : "";

      if (!name.trim()) {
        return null;
      }

      const habit: Habit = {
        id,
        name,
      };

      const goal = normalizeGoal(source.goal);

      if (goal !== undefined) {
        habit.goal = goal;
      }

      return habit;
    })
    .filter((habit): habit is Habit => habit !== null);

  if (habits.length > 0 || !includeSamplesWhenEmpty) {
    return habits;
  }

  return SAMPLE_HABITS.map((name) => ({
    id: createHabitId(),
    name,
  }));
}

function normalizeMonthState(
  source: unknown,
  daysInMonth: number,
  includeSamplesWhenEmpty: boolean,
): HabitMonthState {
  const normalizedSource =
    source && typeof source === "object" ? (source as Record<string, unknown>) : {};

  const habits = normalizeHabits(normalizedSource.habits, includeSamplesWhenEmpty);
  const sourceChecks =
    normalizedSource.checksByHabitId && typeof normalizedSource.checksByHabitId === "object"
      ? (normalizedSource.checksByHabitId as Record<string, unknown>)
      : {};

  const checksByHabitId = Object.fromEntries(
    habits.map((habit) => [habit.id, ensureBooleanArray(sourceChecks[habit.id], daysInMonth)]),
  );

  return {
    habits,
    checksByHabitId,
    mood: ensureScoreArray(normalizedSource.mood, daysInMonth),
    motivation: ensureScoreArray(normalizedSource.motivation, daysInMonth),
  };
}

export function normalizeHabitMonthState(
  source: unknown,
  daysInMonth: number,
  includeSamplesWhenEmpty: boolean,
): HabitMonthState {
  return normalizeMonthState(source, daysInMonth, includeSamplesWhenEmpty);
}

export function getMonthStorageKey(year: number, monthIndex: number): string {
  return `${MONTH_PREFIX}${toYearMonthKey(year, monthIndex)}`;
}

export function getYearStorageKey(year: number): string {
  return `${YEAR_PREFIX}${year}`;
}

export function createDefaultHabitMonthState(daysInMonth: number): HabitMonthState {
  return normalizeMonthState({}, daysInMonth, true);
}

export function loadHabitMonthState(
  year: number,
  monthIndex: number,
  daysInMonth: number,
): HabitMonthState {
  const key = getMonthStorageKey(year, monthIndex);
  const raw = readStorageJSON<unknown | null>(key, null);

  return normalizeMonthState(raw, daysInMonth, true);
}

export function loadHabitMonthStateIfExists(
  year: number,
  monthIndex: number,
  daysInMonth: number,
): HabitMonthState | null {
  const key = getMonthStorageKey(year, monthIndex);

  if (readRawStorageItem(key) === null) {
    return null;
  }

  const raw = readStorageJSON<unknown | null>(key, null);

  return normalizeMonthState(raw, daysInMonth, false);
}

export function saveHabitMonthState(
  year: number,
  monthIndex: number,
  state: HabitMonthState,
): void {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const normalized = normalizeMonthState(state, daysInMonth, false);

  writeStorageJSON(getMonthStorageKey(year, monthIndex), normalized);
}

export function loadSelectedHabitMonth(): MonthSelection {
  const fallback = getCurrentMonthSelection();
  const raw = readStorageString(SELECTED_MONTH_KEY, "");

  if (!raw) {
    return fallback;
  }

  const parsed = fromYearMonthKey(raw);
  return parsed ?? fallback;
}

export function saveSelectedHabitMonth(year: number, monthIndex: number): void {
  writeStorageString(SELECTED_MONTH_KEY, toYearMonthKey(year, monthIndex));
}

export function saveYearStatisticsCache(
  year: number,
  cache: YearlyStatisticsCache,
): void {
  writeStorageJSON(getYearStorageKey(year), cache);
}

export function loadYearStatisticsCache(year: number): YearlyStatisticsCache | null {
  return readStorageJSON<YearlyStatisticsCache | null>(getYearStorageKey(year), null);
}

export function listStoredMonthKeysForYear(year: number): string[] {
  return listStorageKeys(MONTH_PREFIX)
    .map((key) => key.replace(MONTH_PREFIX, ""))
    .filter((key) => key.startsWith(`${year}-`));
}
