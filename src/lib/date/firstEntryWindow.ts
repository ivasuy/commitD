import { addDaysLocal, parseLocalYMD, toLocalYMD } from "@/src/lib/time/localTime";

interface TimestampLike {
  toDate?: () => Date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseMonthStart(monthKeyYm: string): Date | null {
  const match = monthKeyYm.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const timestamp = value as TimestampLike;

  if (typeof timestamp.toDate === "function") {
    const parsed = timestamp.toDate();
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function getFirstEntryDate(profile: { firstEntryAt?: unknown } | null): Date | null {
  return toDate(profile?.firstEntryAt);
}

export function getFirstEntryYmd(profile: { firstEntryAt?: unknown } | null): string | null {
  const firstEntryDate = getFirstEntryDate(profile);

  if (!firstEntryDate) {
    return null;
  }

  return toLocalYMD(startOfDay(firstEntryDate));
}

export function hasFirstEntry(profile: { firstEntryAt?: unknown } | null): boolean {
  return getFirstEntryDate(profile) !== null;
}

export function isBeforeFirstEntry(date: Date, firstEntryDate: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(firstEntryDate).getTime();
}

export function isWeekBeforeFirstEntry(weekStartYmd: string, firstEntryDate: Date): boolean {
  const weekEnd = startOfDay(parseLocalYMD(addDaysLocal(weekStartYmd, 6)));
  const firstEntryDay = startOfDay(firstEntryDate);

  return weekEnd.getTime() < firstEntryDay.getTime();
}

export function isMonthBeforeFirstEntry(monthKeyYm: string, firstEntryDate: Date): boolean {
  const monthStart = parseMonthStart(monthKeyYm);

  if (!monthStart) {
    return true;
  }

  const firstEntryMonth = new Date(
    firstEntryDate.getFullYear(),
    firstEntryDate.getMonth(),
    1,
  );

  return monthStart.getTime() < firstEntryMonth.getTime();
}

export function clampToFirstEntry(date: Date, firstEntryDate: Date): Date {
  return isBeforeFirstEntry(date, firstEntryDate) ? startOfDay(firstEntryDate) : date;
}
