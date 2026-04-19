import {
  getLocalNow,
  prevMonthKey,
  toLocalYM,
  toLocalYMD,
} from "@/src/lib/time/localTime";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function toPadded(value: number): string {
  return String(value).padStart(2, "0");
}

export function toMonthKey(year: number, monthIndex: number): string {
  return `${year}-${toPadded(monthIndex + 1)}`;
}

export function parseMonthKey(monthKey: string): { year: number; monthIndex: number } | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return null;
  }

  if (monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  return {
    year,
    monthIndex,
  };
}

export function clampYear(year: number): number {
  if (!Number.isFinite(year)) {
    return getLocalNow().getFullYear();
  }

  return Math.min(9999, Math.max(1970, Math.round(year)));
}

export function normalizeMonthIndex(monthIndex: number): number {
  if (!Number.isFinite(monthIndex)) {
    return 0;
  }

  return Math.min(11, Math.max(0, Math.floor(monthIndex)));
}

export function getCurrentMonthKey(): string {
  if (typeof window === "undefined") {
    return "1970-01";
  }

  return toLocalYM(getLocalNow());
}

export function getMonthLabel(monthKey: string): string {
  const parsed = parseMonthKey(monthKey);

  if (!parsed) {
    return "Unknown Month";
  }

  return `${MONTH_NAMES[parsed.monthIndex]} ${parsed.year}`;
}

export function getPreviousMonthKey(monthKey: string): string {
  return prevMonthKey(monthKey);
}

export function todayISODate(): string {
  if (typeof window === "undefined") {
    return "1970-01-01";
  }

  return toLocalYMD(getLocalNow());
}

export function isDateInMonth(dateISO: string, monthKey: string): boolean {
  return dateISO.startsWith(`${monthKey}-`);
}

export function buildMonthDate(monthKey: string, day: number): string {
  const safeDay = Math.min(28, Math.max(1, Math.round(day)));
  return `${monthKey}-${toPadded(safeDay)}`;
}
