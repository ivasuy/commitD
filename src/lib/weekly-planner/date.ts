import { DAY_INDICES, type DayIndex } from "./storage";
import {
  addDaysLocal,
  getLocalNow,
  parseLocalYMD,
  toLocalYMD,
} from "@/src/lib/time/localTime";

export interface WeekDayInfo {
  index: DayIndex;
  date: Date;
  isoDate: string;
  weekdayShort: string;
  dateLabel: string;
  fullLabel: string;
}

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

function toPadded(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseISODate(value: string): Date {
  return parseLocalYMD(value);
}

export function toISODate(date: Date): string {
  return toLocalYMD(date);
}

export function todayISODate(): string {
  if (typeof window === "undefined") {
    return "1970-01-01";
  }

  return toLocalYMD(getLocalNow());
}

export function addDays(baseDate: Date, dayOffset: number): Date {
  const ymd = toLocalYMD(baseDate);
  return parseLocalYMD(addDaysLocal(ymd, dayOffset));
}

export function getWeekStartFromDate(date: Date): string {
  const dayStart = parseLocalYMD(toLocalYMD(date));
  const mondayOffset = (dayStart.getDay() + 6) % 7;
  return addDaysLocal(toLocalYMD(dayStart), -mondayOffset);
}

export function formatDateLabel(date: Date): string {
  const day = toPadded(date.getDate());
  const month = toPadded(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function getWeekDays(weekStart: string): WeekDayInfo[] {
  const startDate = parseISODate(weekStart);

  return DAY_INDICES.map((index) => {
    const date = addDays(startDate, index);
    const weekdayShort = weekdayFormatter.format(date);
    const dateLabel = formatDateLabel(date);

    return {
      index,
      date,
      isoDate: toISODate(date),
      weekdayShort,
      dateLabel,
      fullLabel: `${weekdayShort} ${dateLabel}`,
    };
  });
}
