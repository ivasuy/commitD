"use client";

import { useMemo, useState } from "react";

import ProgressBar from "@/src/components/habit-tracker/charts/ProgressBar";
import {
  HABIT_DAY_COLUMN_WIDTH,
  HABIT_GRID_BORDER_CLASS,
  HABIT_ROW_HEIGHT_CLASS,
  getVisibleWeekCells,
} from "@/src/components/habit-tracker/weekWindow";
import type { CalendarCell } from "@/src/lib/date";
import type { Habit } from "@/src/lib/habit-tracker/types";
import { Button } from "../ui/button";

interface HabitTrackerGridProps {
  habits: Habit[];
  week: CalendarCell[];
  weekIndex: number;
  checksByHabitId: Record<string, boolean[]>;
  highlightedHabitId: string | null;
  mood: number[];
  motivation: number[];
  canEditWeek: boolean;
  isDayEditable: (dayNumber: number) => boolean;
  onAddHabit: (name: string) => void;
  onRenameHabit: (habitId: string, name: string) => void;
  onUpdateGoal: (habitId: string, goal: number) => void;
  onDeleteHabit: (habitId: string) => void;
  onHighlightHabit: (habitId: string) => void;
  onToggleCheck: (habitId: string, dayNumber: number) => void;
  onMoodChange: (dayNumber: number, value: number) => void;
  onMotivationChange: (dayNumber: number, value: number) => void;
  perDayProgressPercent: number[];
  perDayDone: number[];
  perDayNotDone: number[];
}

const LEFT_COLS_COUNT = 4;
const NAME_COL_WIDTH = "minmax(120px, 1fr)";
const GOAL_COL_WIDTH = "44px";
const ACTUAL_COL_WIDTH = "48px";
const PROGRESS_COL_WIDTH = "96px";
const HABIT_BODY_MAX_HEIGHT_PX = 5 * 44;

function normalizeScoreInput(value: string): number {
  if (!value) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const rounded = Math.round(parsed);
  return Math.max(1, Math.min(10, rounded));
}

function toInputValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return String(Math.max(1, Math.min(10, Math.round(value))));
}

export default function HabitTrackerGrid({
  habits,
  week,
  weekIndex,
  checksByHabitId,
  highlightedHabitId,
  mood,
  motivation,
  canEditWeek,
  isDayEditable,
  onAddHabit,
  onRenameHabit,
  onUpdateGoal,
  onDeleteHabit,
  onHighlightHabit,
  onToggleCheck,
  onMoodChange,
  onMotivationChange,
  perDayProgressPercent,
  perDayDone,
  perDayNotDone,
}: HabitTrackerGridProps) {
  const [draftHabit, setDraftHabit] = useState("");

  const visibleWeek = useMemo(() => getVisibleWeekCells(week), [week]);
  const dayCount = Math.max(1, visibleWeek.length);

  const visibleDayNumbers = useMemo(
    () =>
      visibleWeek
        .map((cell) => cell.dayNumber)
        .filter((dayNumber): dayNumber is number => dayNumber !== null),
    [visibleWeek],
  );

  const rowMetricsByHabitId = useMemo(
    () =>
      Object.fromEntries(
        habits.map((habit) => {
          const checks = checksByHabitId[habit.id] ?? [];
          const actual = visibleDayNumbers.reduce(
            (count, dayNumber) => count + (checks[dayNumber - 1] ? 1 : 0),
            0,
          );
          const rawGoal = Number(habit.goal);
          const goal = Number.isFinite(rawGoal)
            ? Math.max(0, Math.min(7, Math.round(rawGoal)))
            : 0;
          const progressPercent =
            goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0;

          return [habit.id, { goal, actual, progressPercent }];
        }),
      ),
    [habits, checksByHabitId, visibleDayNumbers],
  );

  const addHabit = () => {
    const name = draftHabit.trim();
    if (!name || !canEditWeek) return;
    onAddHabit(name);
    setDraftHabit("");
  };

  const gridTemplateColumns = `${NAME_COL_WIDTH} ${GOAL_COL_WIDTH} ${ACTUAL_COL_WIDTH} ${PROGRESS_COL_WIDTH} repeat(${dayCount}, ${HABIT_DAY_COLUMN_WIDTH}px)`;

  const totalDayColumnsWidth = dayCount * HABIT_DAY_COLUMN_WIDTH;
  const minGridWidth = `calc(120px + 44px + 48px + 96px + ${totalDayColumnsWidth}px + 2rem)`;

  const summaryRows = [
    {
      label: "Progress",
      values: perDayProgressPercent,
      formatter: (v: number) => `${v}%`,
    },
    { label: "Done", values: perDayDone, formatter: (v: number) => String(v) },
    {
      label: "Not Done",
      values: perDayNotDone,
      formatter: (v: number) => String(v),
    },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div className="flex flex-1 flex-col gap-2">
          <label
            htmlFor="add-habit"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60"
          >
            Add Habit
          </label>
          <div className="flex min-w-0 gap-2">
            <input
              id="add-habit"
              value={draftHabit}
              onChange={(e) => setDraftHabit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHabit();
                }
              }}
              placeholder="Add habit"
              className="min-w-0 flex-1 rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canEditWeek}
            />
            <button
              type="button"
              onClick={addHabit}
              disabled={!canEditWeek}
              className="rounded border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white/80 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="max-h-[75vh] space-y-3 overflow-y-auto scrollbar-thin-dark md:hidden">
        {/* Mood & Motivation Section */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-3">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Daily Mood & Motivation
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {visibleWeek.map((cell) => {
              const dayNumber = cell.dayNumber;
              if (dayNumber === null) return null;
              const dayEditable = isDayEditable(dayNumber);
              const moodValue = mood[dayNumber - 1] ?? 0;
              const motivationValue = motivation[dayNumber - 1] ?? 0;

              return (
                <div
                  key={`mobile-mood-${weekIndex}-${cell.dateKey}`}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="text-[9px] text-white/60">
                    {cell.weekdayLabel}
                  </div>
                  <div className="text-[10px] font-semibold text-white/80">
                    {dayNumber}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={toInputValue(moodValue)}
                    onChange={(e) =>
                      onMoodChange(
                        dayNumber,
                        normalizeScoreInput(e.target.value),
                      )
                    }
                    disabled={!dayEditable}
                    placeholder="-"
                    className="h-6 w-full rounded border border-white/15 bg-white/5 px-0.5 text-center text-[10px] text-white outline-none focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Mood for day ${dayNumber}`}
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={toInputValue(motivationValue)}
                    onChange={(e) =>
                      onMotivationChange(
                        dayNumber,
                        normalizeScoreInput(e.target.value),
                      )
                    }
                    disabled={!dayEditable}
                    placeholder="-"
                    className="h-6 w-full rounded border border-white/15 bg-white/5 px-0.5 text-center text-[10px] text-white outline-none focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Motivation for day ${dayNumber}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-[9px] text-white/50">
            <span>Top: Mood</span>
            <span>Bottom: Motivation</span>
          </div>
        </div>

        {/* Habits Cards */}
        {habits.length === 0 ? (
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
            No habits yet. Add your first habit above.
          </div>
        ) : (
          habits.map((habit) => {
            const metric = rowMetricsByHabitId[habit.id] ?? {
              goal: 0,
              actual: 0,
              progressPercent: 0,
            };
            const goalInputValue = metric.goal > 0 ? String(metric.goal) : "";
            const isHighlighted = highlightedHabitId === habit.id;

            return (
              <div
                key={habit.id}
                className={`rounded-xl border p-3 space-y-3 ${isHighlighted ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-white/5"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={habit.name}
                    onChange={(e) => onRenameHabit(habit.id, e.target.value)}
                    onFocus={() => onHighlightHabit(habit.id)}
                    disabled={!canEditWeek}
                    className="min-w-0 flex-1 rounded border border-white/15 bg-white/5 px-2 py-1.5 text-sm font-medium text-white/90 outline-none focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Habit name"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDeleteHabit(habit.id)}
                    disabled={!canEditWeek}
                    aria-label="Delete habit"
                  >
                    ×
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/50">Goal:</span>
                    <input
                      type="number"
                      min={0}
                      max={7}
                      step={1}
                      value={goalInputValue}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const parsed = raw === "" ? 0 : Number(raw);
                        if (!Number.isFinite(parsed)) return;
                        onUpdateGoal(habit.id, parsed);
                      }}
                      disabled={!canEditWeek}
                      placeholder="0"
                      className="h-6 w-10 rounded border border-white/15 bg-white/5 px-1 text-center text-xs text-white/90 outline-none focus:ring-1 focus:ring-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Weekly goal for ${habit.name}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/50">Actual:</span>
                    <span className="text-sm font-semibold text-white/85">
                      {metric.actual}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                      <ProgressBar
                        value={metric.progressPercent}
                        className="h-full w-full min-w-0 border-0 border-white/25 bg-white/20"
                        fillClassName="bg-emerald-400"
                      />
                    </div>
                    <span className="text-xs font-semibold text-white/70">
                      {metric.progressPercent}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {visibleWeek.map((cell) => {
                    const dayNumber = cell.dayNumber;
                    if (dayNumber === null) return null;
                    const dayEditable = isDayEditable(dayNumber);

                    return (
                      <div
                        key={`${habit.id}-mobile-${cell.dateKey}`}
                        className="flex flex-col items-center"
                      >
                        <span className="text-[9px] text-white/50">
                          {cell.weekdayLabel}
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            checksByHabitId[habit.id]?.[dayNumber - 1],
                          )}
                          onChange={() => {
                            if (!dayEditable) return;
                            onToggleCheck(habit.id, dayNumber);
                          }}
                          disabled={!dayEditable}
                          className="mt-1 h-5 w-5 rounded-[2px] border-white/30 accent-[#86efac] focus:ring-white/40 disabled:opacity-60"
                          aria-label={`${habit.name} ${cell.weekdayLabel}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Daily Summary */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-3">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Daily Summary
          </h4>
          {summaryRows.map((row) => (
            <div key={row.label} className="mb-2 last:mb-0">
              <div className="mb-1 text-[10px] font-semibold text-white/70">
                {row.label}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {visibleWeek.map((cell) => {
                  const dayNumber = cell.dayNumber;
                  const value =
                    dayNumber !== null ? (row.values[dayNumber - 1] ?? 0) : 0;
                  return (
                    <div
                      key={`${row.label}-mobile-${cell.dateKey}`}
                      className="flex flex-col items-center"
                    >
                      <span className="text-[9px] text-white/50">
                        {cell.weekdayLabel}
                      </span>
                      <span className="text-xs font-semibold text-white/85">
                        {row.formatter(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden overflow-x-auto scrollbar-thin-dark md:block">
        <div
          className={`grid rounded-lg border ${HABIT_GRID_BORDER_CLASS} bg-white/2`}
          style={{ gridTemplateColumns, minWidth: minGridWidth }}
        >
          {/* === HEADER ROW: Left labels + Day columns === */}
          <div
            className={`flex items-end border-b border-r ${HABIT_GRID_BORDER_CLASS} bg-white/5 px-2 pb-1.5 pt-2`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
              Name
            </span>
          </div>
          <div
            className={`flex items-end justify-center border-b border-r ${HABIT_GRID_BORDER_CLASS} bg-white/5 pb-1.5 pt-2`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
              Goal
            </span>
          </div>
          <div
            className={`flex items-end justify-center border-b border-r ${HABIT_GRID_BORDER_CLASS} bg-white/5 pb-1.5 pt-2`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
              Actual
            </span>
          </div>
          <div
            className={`flex items-end justify-center border-b border-r ${HABIT_GRID_BORDER_CLASS} bg-white/5 pb-1.5 pt-2`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
              Progress
            </span>
          </div>

          {visibleWeek.map((cell, idx) => {
            const dayNumber = cell.dayNumber;
            if (dayNumber === null) return null;

            const dayEditable = isDayEditable(dayNumber);
            const moodValue = mood[dayNumber - 1] ?? 0;
            const motivationValue = motivation[dayNumber - 1] ?? 0;
            const isLast = idx === visibleWeek.length - 1;

            return (
              <div
                key={`header-${weekIndex}-${cell.dateKey}`}
                className={`flex flex-col border-b ${HABIT_GRID_BORDER_CLASS} bg-white/5 px-1.5 py-1.5 ${
                  isLast ? "" : `border-r ${HABIT_GRID_BORDER_CLASS}`
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/70">
                  <span>{cell.weekdayLabel}</span>
                  <span className="font-semibold text-white/90">
                    {dayNumber}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Mood
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={toInputValue(moodValue)}
                    onChange={(e) =>
                      onMoodChange(
                        dayNumber,
                        normalizeScoreInput(e.target.value),
                      )
                    }
                    disabled={!dayEditable}
                    placeholder="-"
                    className="h-6 w-full rounded border border-white/15 bg-white/5 px-1 text-xs text-white outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Mood for day ${dayNumber}`}
                  />
                  <label className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Motivation
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={toInputValue(motivationValue)}
                    onChange={(e) =>
                      onMotivationChange(
                        dayNumber,
                        normalizeScoreInput(e.target.value),
                      )
                    }
                    disabled={!dayEditable}
                    placeholder="-"
                    className="h-6 w-full rounded border border-white/15 bg-white/5 px-1 text-xs text-white outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Motivation for day ${dayNumber}`}
                  />
                </div>
              </div>
            );
          })}

          {/* === HABIT BODY ROWS: fixed height, scroll after 5 rows === */}
          <div
            className="grid min-h-0 overflow-y-auto scrollbar-thin-dark border-b border-white/10"
            style={{
              gridColumn: "1 / -1",
              gridTemplateColumns: "subgrid",
              maxHeight: HABIT_BODY_MAX_HEIGHT_PX,
            }}
          >
            {habits.length === 0 ? (
              <>
                <div
                  className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center border-b border-r ${HABIT_GRID_BORDER_CLASS} px-2 text-xs text-white/60`}
                  style={{ gridColumn: `1 / ${LEFT_COLS_COUNT + 1}` }}
                >
                  No habits yet
                </div>
                {visibleWeek.map((cell, idx) => {
                  const isLast = idx === visibleWeek.length - 1;
                  return (
                    <div
                      key={`empty-${weekIndex}-${cell.dateKey}`}
                      className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center border-b ${HABIT_GRID_BORDER_CLASS} text-[10px] text-white/35 ${
                        isLast ? "" : `border-r ${HABIT_GRID_BORDER_CLASS}`
                      }`}
                    >
                      -
                    </div>
                  );
                })}
              </>
            ) : (
              habits.map((habit, habitIdx) => {
                const metric = rowMetricsByHabitId[habit.id] ?? {
                  goal: 0,
                  actual: 0,
                  progressPercent: 0,
                };
                const goalInputValue =
                  metric.goal > 0 ? String(metric.goal) : "";
                const isHighlighted = highlightedHabitId === habit.id;
                const isLastRow = habitIdx === habits.length - 1;
                const rowBorderClass = isLastRow
                  ? ""
                  : `border-b ${HABIT_GRID_BORDER_CLASS}`;

                return (
                  <div
                    key={habit.id}
                    className="contents"
                    style={{ display: "contents" }}
                  >
                    {/* Name + Delete (right-most of name column) */}
                    <div
                      className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center gap-1.5 border-r ${HABIT_GRID_BORDER_CLASS} ${rowBorderClass} px-2 ${
                        isHighlighted ? "bg-emerald-500/10" : "bg-transparent"
                      }`}
                    >
                      <input
                        value={habit.name}
                        onChange={(e) =>
                          onRenameHabit(habit.id, e.target.value)
                        }
                        onFocus={() => onHighlightHabit(habit.id)}
                        disabled={!canEditWeek}
                        className="h-7 min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-1 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Habit name"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => onDeleteHabit(habit.id)}
                        disabled={!canEditWeek}
                        aria-label="Delete habit"
                      >
                        ×
                      </Button>
                    </div>

                    {/* Goal */}
                    <div
                      className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center border-r ${HABIT_GRID_BORDER_CLASS} ${rowBorderClass} ${
                        isHighlighted ? "bg-emerald-500/10" : "bg-transparent"
                      }`}
                    >
                      <input
                        type="number"
                        min={0}
                        max={7}
                        step={1}
                        value={goalInputValue}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const parsed = raw === "" ? 0 : Number(raw);
                          if (!Number.isFinite(parsed)) return;
                          onUpdateGoal(habit.id, parsed);
                        }}
                        disabled={!canEditWeek}
                        placeholder="0"
                        className="h-7 w-9 rounded border border-white/15 bg-white/5 px-1 text-center text-xs text-white/90 outline-none focus:ring-1 focus:ring-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Weekly goal for ${habit.name}`}
                      />
                    </div>

                    {/* Actual */}
                    <div
                      className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center border-r ${HABIT_GRID_BORDER_CLASS} ${rowBorderClass} ${
                        isHighlighted ? "bg-emerald-500/10" : "bg-transparent"
                      }`}
                    >
                      <span className="text-xs font-semibold text-white/85">
                        {metric.actual}
                      </span>
                    </div>

                    {/* Progress */}
                    <div
                      className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center gap-1.5 border-r ${HABIT_GRID_BORDER_CLASS} ${rowBorderClass} px-1.5 ${
                        isHighlighted ? "bg-emerald-500/10" : "bg-transparent"
                      }`}
                    >
                      <span className="shrink-0 text-[10px] font-semibold text-white/70">
                        {metric.progressPercent}%
                      </span>
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded">
                        <ProgressBar
                          value={metric.progressPercent}
                          className="h-full w-full min-w-0 border-0 border-white/25 bg-white/20"
                          fillClassName="bg-emerald-400"
                        />
                      </div>
                    </div>

                    {/* Day checkboxes */}
                    {visibleWeek.map((cell, idx) => {
                      const dayNumber = cell.dayNumber;
                      if (dayNumber === null) return null;

                      const dayEditable = isDayEditable(dayNumber);
                      const isLast = idx === visibleWeek.length - 1;

                      return (
                        <div
                          key={`${habit.id}-${weekIndex}-${cell.dateKey}`}
                          className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center ${rowBorderClass} ${
                            isLast ? "" : `border-r ${HABIT_GRID_BORDER_CLASS}`
                          } ${isHighlighted ? "bg-emerald-500/10" : "bg-transparent"}`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(
                              checksByHabitId[habit.id]?.[dayNumber - 1],
                            )}
                            onChange={() => {
                              if (!dayEditable) return;
                              onToggleCheck(habit.id, dayNumber);
                            }}
                            disabled={!dayEditable}
                            className="h-4 w-4 rounded-[2px] border-white/30 accent-[#86efac] focus:ring-white/40 disabled:opacity-60"
                            aria-label={`${habit.name} day ${dayNumber}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* === DAILY SUMMARY SEPARATOR === */}
          <div
            className={`col-span-full flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center border-b border-t ${HABIT_GRID_BORDER_CLASS} bg-white/5 text-xs font-semibold uppercase tracking-[0.2em] text-white/60`}
            style={{ gridColumn: `1 / -1` }}
          >
            Daily Summary
          </div>

          {/* === SUMMARY FOOTER ROWS === */}
          {summaryRows.map((row, rowIdx) => {
            const isLastSummary = rowIdx === summaryRows.length - 1;
            const summaryBorderClass = isLastSummary
              ? ""
              : `border-b ${HABIT_GRID_BORDER_CLASS}`;

            return (
              <div
                key={row.label}
                className="contents"
                style={{ display: "contents" }}
              >
                {/* Label spanning the first 4 columns */}
                <div
                  className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center border-r ${HABIT_GRID_BORDER_CLASS} ${summaryBorderClass} bg-white/5 px-2 text-xs font-semibold text-white/80`}
                  style={{ gridColumn: `1 / ${LEFT_COLS_COUNT + 1}` }}
                >
                  {row.label}
                </div>

                {/* Values for each day */}
                {visibleWeek.map((cell, idx) => {
                  const dayNumber = cell.dayNumber;
                  const isLast = idx === visibleWeek.length - 1;
                  const value =
                    dayNumber !== null ? (row.values[dayNumber - 1] ?? 0) : 0;

                  return (
                    <div
                      key={`${row.label}-${cell.dateKey}`}
                      className={`flex ${HABIT_ROW_HEIGHT_CLASS} items-center justify-center ${summaryBorderClass} ${
                        isLast ? "" : `border-r ${HABIT_GRID_BORDER_CLASS}`
                      } text-sm font-semibold text-white/90`}
                    >
                      {row.formatter(value)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
