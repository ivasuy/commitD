"use client";

import { useState } from "react";

import Input from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/button";
import ProgressRing from "@/src/components/weekly-planner/ProgressRing";
import type { WeekDayInfo } from "@/src/lib/weekly-planner/date";
import type { DayMetric } from "@/src/lib/weekly-planner/metrics";
import type { DayIndex, PlannerTask } from "@/src/lib/weekly-planner/storage";
import { SegmentedProgress } from "../ui/progress-bar";

interface DayColumnProps {
  day: WeekDayInfo;
  tasks: PlannerTask[];
  metric: DayMetric;
  isEditable: boolean;
  onAddTask: (dayIndex: DayIndex, text: string) => void;
  onToggleTask: (dayIndex: DayIndex, taskId: string) => void;
  onRemoveTask: (dayIndex: DayIndex, taskId: string) => void;
}

export default function DayColumn({
  day,
  tasks,
  metric,
  isEditable,
  onAddTask,
  onToggleTask,
  onRemoveTask,
}: DayColumnProps) {
  // Reference: /Users/vasuyadav/Desktop/Screenshot 2026-02-18 at 7.03.51 PM.png
  const [draftTask, setDraftTask] = useState("");

  const addTask = () => {
    const text = draftTask.trim();

    if (!text || !isEditable) {
      return;
    }

    onAddTask(day.index, text);
    setDraftTask("");
  };

  return (
    <div className="rounded-xl p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-600/80 px-3 py-2 text-white">
        <div className="min-w-0 flex-1">
          <SegmentedProgress
            value={metric.percent}
            segments={20}
            showPercentage={false}
            showDemo={false}
            variant="on-dark"
            className="gap-1"
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ProgressRing percentage={metric.percent} size={86} />
          <div className="text-right text-xs">
            <p>
              {metric.completed} done / {metric.total} total
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 flex min-w-0 gap-2">
        <label htmlFor={`task-input-${day.index}`} className="sr-only">
          Add task
        </label>
        <Input
          id={`task-input-${day.index}`}
          value={draftTask}
          onChange={(event) => setDraftTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTask();
            }
          }}
          placeholder="Add a task and press Enter"
          className="min-w-0 flex-1 py-1.5 text-sm"
          disabled={!isEditable}
        />
        <Button
          type="button"
          onClick={addTask}
          aria-label={`Add task for ${day.weekdayShort}`}
          disabled={!isEditable}
        >
          Add
        </Button>
      </div>

      <div className="rounded-xl border border-white/15 bg-white/5">
        <ul className="h-[220px] divide-y divide-white/15 overflow-y-auto scrollbar-thin-dark">
          {tasks.map((task) => (
            <li key={task.id} className="px-2 py-1.5">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {
                    if (!isEditable) {
                      return;
                    }

                    onToggleTask(day.index, task.id);
                  }}
                  disabled={!isEditable}
                  className="mt-0.5 h-4 w-4 rounded border-white/30 accent-[#86efac] focus:ring-white/40 disabled:opacity-60"
                />

                <span
                  className={`flex-1 text-sm text-white/90 ${task.done ? "line-through text-white/60" : ""}`}
                >
                  {task.text}
                </span>

                <Button
                  type="button"
                  onClick={() => {
                    if (!isEditable) {
                      return;
                    }

                    onRemoveTask(day.index, task.id);
                  }}
                  disabled={!isEditable}
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}

          {tasks.length === 0 ? (
            <li className="flex min-h-[220px] items-center justify-center px-2 text-sm text-white/60">
              No tasks yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
