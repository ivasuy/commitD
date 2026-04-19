import { getLocalNow } from "@/src/lib/time/localTime";

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

export const WEEKDAY_LABELS_SATURDAY_FIRST = [
  "Sa",
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
] as const;

const SATURDAY_FIRST_WEEKDAY_ORDER: number[] = [6, 0, 1, 2, 3, 4, 5];

export interface CalendarCell {
  weekIndex: number;
  dayIndexInWeek: number;
  dayNumber: number | null;
  weekdayLabel: (typeof WEEKDAY_LABELS_SATURDAY_FIRST)[number];
  dateKey: string | null;
}

export interface MonthCalendar {
  weeks: CalendarCell[][];
  flatCells: CalendarCell[];
}

export interface MonthSelection {
  year: number;
  monthIndex: number;
}

function toPadded(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCurrentMonthSelection(): MonthSelection {
  if (typeof window === "undefined") {
    return {
      year: 1970,
      monthIndex: 0,
    };
  }

  const now = getLocalNow();

  return {
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
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

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function toYearMonthKey(year: number, monthIndex: number): string {
  return `${year}-${toPadded(monthIndex + 1)}`;
}

export function fromYearMonthKey(key: string): MonthSelection | null {
  const match = key.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
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

export function toDateKey(year: number, monthIndex: number, dayNumber: number): string {
  return `${year}-${toPadded(monthIndex + 1)}-${toPadded(dayNumber)}`;
}

export function buildMonthCalendar(
  year: number,
  monthIndex: number,
): MonthCalendar {
  const normalizedYear = clampYear(year);
  const normalizedMonthIndex = normalizeMonthIndex(monthIndex);
  const daysInMonth = getDaysInMonth(normalizedYear, normalizedMonthIndex);

  const firstWeekday = new Date(normalizedYear, normalizedMonthIndex, 1).getDay();
  const leadingEmptyCells = SATURDAY_FIRST_WEEKDAY_ORDER.indexOf(firstWeekday);
  const totalCells = Math.ceil((leadingEmptyCells + daysInMonth) / 7) * 7;

  const flatCells: CalendarCell[] = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingEmptyCells + 1;
    const dayIndexInWeek = index % 7;

    const isInMonth = dayNumber >= 1 && dayNumber <= daysInMonth;

    return {
      weekIndex: Math.floor(index / 7),
      dayIndexInWeek,
      dayNumber: isInMonth ? dayNumber : null,
      weekdayLabel: WEEKDAY_LABELS_SATURDAY_FIRST[dayIndexInWeek],
      dateKey: isInMonth ? toDateKey(normalizedYear, normalizedMonthIndex, dayNumber) : null,
    };
  });

  const weeks: CalendarCell[][] = [];

  for (let index = 0; index < flatCells.length; index += 7) {
    weeks.push(flatCells.slice(index, index + 7));
  }

  return {
    weeks,
    flatCells,
  };
}
