import { getLocalNow, parseLocalYMD, toLocalYMD } from "@/src/lib/time/localTime";

const WEEK_START_DAY = 6;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const dayStart = startOfDay(date);
  const dayOffset = (dayStart.getDay() - WEEK_START_DAY + 7) % 7;
  dayStart.setDate(dayStart.getDate() - dayOffset);
  return dayStart;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function parseMonthKey(monthKeyYm: string): Date | null {
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

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getJoinDate(profile: { createdAt?: unknown }): Date {
  const createdAt = profile?.createdAt;

  if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "toDate" in createdAt &&
    typeof (createdAt as { toDate?: () => Date }).toDate === "function"
  ) {
    const parsed = (createdAt as { toDate: () => Date }).toDate();
    if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (createdAt instanceof Date && !Number.isNaN(createdAt.getTime())) {
    return createdAt;
  }

  if (typeof createdAt === "string" || typeof createdAt === "number") {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

export function toYmd(date: Date): string {
  return toLocalYMD(startOfDay(date));
}

export function isBeforeJoin(date: Date, joinDate: Date): boolean {
  return startOfDay(date).getTime() < startOfDay(joinDate).getTime();
}

export function clampToJoin(date: Date, joinDate: Date): Date {
  return isBeforeJoin(date, joinDate) ? startOfDay(joinDate) : date;
}

export function isMonthBeforeJoin(monthKeyYm: string, joinDate: Date): boolean {
  const monthStart = parseMonthKey(monthKeyYm);

  if (!monthStart) {
    return true;
  }

  const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
  return monthStart.getTime() < joinMonthStart.getTime();
}

export function isWeekBeforeJoin(weekStartYmd: string, joinDate: Date): boolean {
  const weekStart = startOfDay(parseLocalYMD(weekStartYmd));
  return weekStart.getTime() < startOfWeek(joinDate).getTime();
}

export function clampMonthKey(monthKeyYm: string, joinDate: Date): string {
  const monthStart = parseMonthKey(monthKeyYm);
  const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

  if (!monthStart || monthStart.getTime() < joinMonthStart.getTime()) {
    return toMonthKey(joinMonthStart);
  }

  return toMonthKey(monthStart);
}

export function clampWeekStart(weekStart: Date, joinDate: Date): Date {
  const normalized = startOfWeek(weekStart);
  const joinWeekStart = startOfWeek(joinDate);

  return normalized.getTime() < joinWeekStart.getTime() ? joinWeekStart : normalized;
}

export function getVisibleWeekStarts({
  anchorWeekStart,
  joinDate,
  weeksToShow,
}: {
  anchorWeekStart: Date;
  joinDate: Date;
  weeksToShow: number;
}): Date[] {
  const safeWeeksToShow = Math.max(1, Math.min(5, Math.floor(weeksToShow)));
  const joinWeekStart = startOfWeek(joinDate);
  const anchor = clampWeekStart(anchorWeekStart, joinDate);

  const previousWeeks: Date[] = [];
  for (let offset = safeWeeksToShow - 1; offset >= 1; offset -= 1) {
    const candidate = addDays(anchor, -7 * offset);
    if (candidate.getTime() >= joinWeekStart.getTime()) {
      previousWeeks.push(candidate);
    }
  }

  const visible = [...previousWeeks, anchor];
  let nextOffset = 1;

  while (visible.length < safeWeeksToShow) {
    visible.push(addDays(anchor, 7 * nextOffset));
    nextOffset += 1;
  }

  return visible;
}

export function getWeekDays(weekStart: Date): Date[] {
  const normalizedStart = startOfWeek(weekStart);
  return Array.from({ length: 7 }, (_, index) => addDays(normalizedStart, index));
}

export function dayIndexInMonth(date: Date): number {
  return Math.max(0, date.getDate() - 1);
}

export function isPastDay(date: Date): boolean {
  const todayStart = startOfDay(getLocalNow());
  return startOfDay(date).getTime() < todayStart.getTime();
}
