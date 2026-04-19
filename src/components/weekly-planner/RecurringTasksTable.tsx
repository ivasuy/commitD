"use client";

import { useState } from "react";
import Input from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/button";
import type { WeekDayInfo } from "@/src/lib/weekly-planner/date";
import type { RecurringTaskMetric } from "@/src/lib/weekly-planner/metrics";
import type { DayIndex } from "@/src/lib/weekly-planner/storage";

interface RecurringTasksTableProps {
  weekDays: WeekDayInfo[];
  recurringMetrics: RecurringTaskMetric[];
  onAddTask: (taskName: string) => void;
  onRenameTask: (taskId: string, taskName: string) => void;
  onToggleCheck: (taskId: string, dayIndex: DayIndex) => void;
  onRemoveTask: (taskId: string) => void;
  canEditWeek: boolean;
  isDayEditable: (dayIndex: DayIndex) => boolean;
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-amber-400"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 2h12v3h3v2a5 5 0 0 1-5 5h-.1A6 6 0 0 1 13 16.7V19h4v3H7v-3h4v-2.3A6 6 0 0 1 8.1 12H8a5 5 0 0 1-5-5V5h3V2Zm12 5V7h1a3 3 0 0 0 0-6h-1v6ZM6 7V1H5a3 3 0 0 0 0 6h1Z" />
    </svg>
  );
}

const TASK_COLUMN_WIDTH = 280;
const DAY_COLUMN_WIDTH = 72;
const PROGRESS_COLUMN_WIDTH = 196;

function buildGridMinWidth(dayCount: number): number {
  return TASK_COLUMN_WIDTH + PROGRESS_COLUMN_WIDTH + dayCount * DAY_COLUMN_WIDTH;
}

export default function RecurringTasksTable({
  weekDays,
  recurringMetrics,
  onAddTask,
  onRenameTask,
  onToggleCheck,
  onRemoveTask,
  canEditWeek,
  isDayEditable,
}: RecurringTasksTableProps) {
  const [draftTask, setDraftTask] = useState("");
  const resolvedWeekDays = weekDays;

  const addTask = () => {
    const name = draftTask.trim();

    if (!name || !canEditWeek) {
      return;
    }

    onAddTask(name);
    setDraftTask("");
  };

  const colSpan = resolvedWeekDays.length + 2;

  return (
    <div className="h-full w-full min-w-0">
      <div className="rounded-xl bg-emerald-600/80 px-3 py-1.5 text-center text-lg font-semibold text-white">
        Recurring Tasks
      </div>

      <div className="mt-3 flex min-w-0 gap-2">
        <label htmlFor="recurring-task-input" className="sr-only">
          Add recurring task
        </label>
        <Input
          id="recurring-task-input"
          value={draftTask}
          onChange={(event) => setDraftTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTask();
            }
          }}
          placeholder="Add recurring task and press Enter"
          className="min-w-0 flex-1"
          disabled={!canEditWeek}
        />
        <Button type="button" onClick={addTask} disabled={!canEditWeek}>
          Add
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto scrollbar-thin-dark md:hidden">
        {recurringMetrics.length === 0 ? (
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
            Add recurring tasks for this week.
          </div>
        ) : (
          recurringMetrics.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Recurring task name"
                  value={task.name}
                  onChange={(event) => {
                    if (!canEditWeek) return;
                    onRenameTask(task.id, event.target.value);
                  }}
                  className="min-w-0 flex-1 py-1.5 text-sm"
                  disabled={!canEditWeek}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (!canEditWeek) return;
                    onRemoveTask(task.id);
                  }}
                  aria-label="Remove recurring task"
                  disabled={!canEditWeek}
                  className="shrink-0"
                >
                  Remove
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${task.percent}%`, transition: "width 250ms ease" }}
                  />
                </div>
                <span className="text-sm font-semibold text-white/90">{task.percent}%</span>
                {task.isComplete ? (
                  <span aria-label="Completed all days" title="Completed all days">
                    <TrophyIcon />
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {resolvedWeekDays.map((day) => (
                  <div key={`${task.id}-${day.isoDate}`} className="flex flex-col items-center">
                    <span className="text-[10px] text-white/60">{day.weekdayShort}</span>
                    <input
                      type="checkbox"
                      checked={task.checks[day.index]}
                      onChange={() => {
                        if (!isDayEditable(day.index)) return;
                        onToggleCheck(task.id, day.index);
                      }}
                      disabled={!isDayEditable(day.index)}
                      className="mt-1 h-5 w-5 rounded border-white/30 accent-[#86efac] focus:ring-white/40 disabled:opacity-60"
                      aria-label={`${task.name} ${day.weekdayShort}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="mt-3 hidden overflow-x-auto scrollbar-thin-dark md:block">
        <div
          className="overflow-hidden rounded-xl border border-white/15 bg-white/5"
          style={{ minWidth: `${buildGridMinWidth(resolvedWeekDays.length)}px` }}
        >
          <table className="w-full border-collapse text-sm">
            <colgroup>
              <col style={{ width: `${TASK_COLUMN_WIDTH}px` }} />
              {resolvedWeekDays.map((day) => (
                <col key={`head-col-${day.isoDate}`} style={{ width: `${DAY_COLUMN_WIDTH}px` }} />
              ))}
              <col style={{ width: `${PROGRESS_COLUMN_WIDTH}px` }} />
            </colgroup>

            <thead className="bg-white/5 text-white">
              <tr>
                <th className="border-b border-r border-white/15 px-2 py-2 text-left font-semibold">
                  Task name
                </th>
                {resolvedWeekDays.map((day) => (
                  <th
                    key={day.isoDate}
                    className="border-b border-r border-white/15 px-2 py-2 text-center font-semibold"
                  >
                    <span className="block text-xs">{day.weekdayShort}</span>
                    <span className="block text-[10px] text-white/65">{day.dateLabel.slice(0, 5)}</span>
                  </th>
                ))}
                <th className="border-b border-white/15 px-2 py-2 text-left font-semibold">Progress</th>
              </tr>
            </thead>
          </table>

          <div className="h-[220px] overflow-y-auto scrollbar-thin-dark">
            <table className="w-full border-collapse text-sm">
              <colgroup>
                <col style={{ width: `${TASK_COLUMN_WIDTH}px` }} />
                {resolvedWeekDays.map((day) => (
                  <col key={`body-col-${day.isoDate}`} style={{ width: `${DAY_COLUMN_WIDTH}px` }} />
                ))}
                <col style={{ width: `${PROGRESS_COLUMN_WIDTH}px` }} />
              </colgroup>

              <tbody>
                {recurringMetrics.map((task) => (
                  <tr key={task.id} className="even:bg-white/5">
                    <td className="border-r border-white/15 px-2 py-2 align-middle">
                      <div className="flex min-w-0 items-center gap-2">
                        <Input
                          aria-label="Recurring task name"
                          value={task.name}
                          onChange={(event) => {
                            if (!canEditWeek) {
                              return;
                            }
                            onRenameTask(task.id, event.target.value);
                          }}
                          className="min-w-0 flex-1 py-1.5 text-sm"
                          disabled={!canEditWeek}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            if (!canEditWeek) {
                              return;
                            }
                            onRemoveTask(task.id);
                          }}
                          aria-label="Remove recurring task"
                          disabled={!canEditWeek}
                          className="shrink-0 whitespace-nowrap"
                        >
                          Remove
                        </Button>
                      </div>
                    </td>

                    {resolvedWeekDays.map((day) => (
                      <td key={`${task.id}-${day.isoDate}`} className="border-r border-white/15 p-2 text-center">
                        <input
                          type="checkbox"
                          checked={task.checks[day.index]}
                          onChange={() => {
                            if (!isDayEditable(day.index)) {
                              return;
                            }
                            onToggleCheck(task.id, day.index);
                          }}
                          disabled={!isDayEditable(day.index)}
                          className="h-4 w-4 rounded border-white/30 accent-[#86efac] focus:ring-white/40 disabled:opacity-60"
                          aria-label={`${task.name} ${day.weekdayShort}`}
                        />
                      </td>
                    ))}

                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${task.percent}%`, transition: "width 250ms ease" }}
                          />
                        </div>
                        <span className="w-11 text-right font-semibold text-white/90">{task.percent}%</span>
                        {task.isComplete ? (
                          <span aria-label="Completed all days" title="Completed all days">
                            <TrophyIcon />
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {recurringMetrics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="h-[220px] align-middle text-center text-sm text-white/60"
                    >
                      Add recurring tasks for this week.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
