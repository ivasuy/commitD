import {
  addDaysLocal,
  getLocalNow,
  isBeforeLocal,
  isSameLocalDay,
  parseLocalYMD,
  toLocalYMD,
} from "@/src/lib/time/localTime";

export function toISODate(date: Date): string {
  return toLocalYMD(date);
}

export function todayISODate(): string {
  if (typeof window === "undefined") {
    return "1970-01-01";
  }

  return toLocalYMD(getLocalNow());
}

export function parseISODate(dateISO: string): Date {
  return parseLocalYMD(dateISO);
}

export function addDaysISO(baseISO: string, dayOffset: number): string {
  return addDaysLocal(baseISO, dayOffset);
}

export function isBeforeISO(leftISO: string, rightISO: string): boolean {
  return isBeforeLocal(leftISO, rightISO);
}

export function isSameISO(leftISO: string, rightISO: string): boolean {
  return isSameLocalDay(leftISO, rightISO);
}

export function formatUSDate(dateISO: string): string {
  const date = parseISODate(dateISO);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}
