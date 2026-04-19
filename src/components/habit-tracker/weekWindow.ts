import type { CalendarCell } from "@/src/lib/date";

/** Single source of truth: column width for the left (labels) pane */
export const HABIT_LABEL_COLUMN_CLASS = "20rem";
export const HABIT_DAY_COLUMN_WIDTH = 112;

/** Single source of truth: row height for habit rows and WeekSummary rows (44px) */
export const HABIT_ROW_HEIGHT_CLASS = "h-11";
/** Header row height for the Habits + day columns header */
export const HABIT_HEADER_HEIGHT_CLASS = "h-[5.75rem]";
/** Shared grid border: thickness + color for all habit-tracker grid lines */
export const HABIT_GRID_BORDER_CLASS = "border-white/10";

export function getVisibleWeekCells(week: CalendarCell[]): CalendarCell[] {
  return week.filter((cell) => cell.dayNumber !== null && cell.dateKey !== null);
}

export function getWeekGridMinWidth(visibleWeek: CalendarCell[]): string {
  const dayCount = Math.max(1, visibleWeek.length);
  return `${dayCount * HABIT_DAY_COLUMN_WIDTH}px`;
}
