import { ChevronLeft, ChevronRight } from "lucide-react";

import DayColumn from "@/src/components/weekly-planner/DayColumn";
import Textarea from "@/src/components/ui/Textarea";
import { addDaysLocal, parseLocalYMD } from "@/src/lib/time/localTime";
import type { WeekDayInfo } from "@/src/lib/weekly-planner/date";
import type { DayMetric } from "@/src/lib/weekly-planner/metrics";
import type { DayIndex, TasksByDay } from "@/src/lib/weekly-planner/storage";

interface WeeklyPlannerProps {
  weekStart: string;
  weekStarts: string[];
  onWeekStartChange: (weekStart: string) => void;
  quote: string;
  onQuoteChange: (value: string) => void;
  weekDays: WeekDayInfo[];
  tasksByDay: TasksByDay;
  selectedDay: DayIndex;
  selectedDayMetric: DayMetric;
  onSelectDay: (dayIndex: DayIndex) => void;
  onAddTask: (dayIndex: DayIndex, text: string) => void;
  onToggleTask: (dayIndex: DayIndex, taskId: string) => void;
  onRemoveTask: (dayIndex: DayIndex, taskId: string) => void;
  isDayEditable: (dayIndex: DayIndex) => boolean;
  canEditWeek: boolean;
}

const weekLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatWeekRange(weekStart: string): string {
  const startDate = parseLocalYMD(weekStart);
  const endDate = parseLocalYMD(addDaysLocal(weekStart, 6));
  return `${weekLabelFormatter.format(startDate)} - ${weekLabelFormatter.format(endDate)}`;
}

export default function WeeklyPlanner({
  weekStart,
  weekStarts,
  onWeekStartChange,
  quote,
  onQuoteChange,
  weekDays,
  tasksByDay,
  selectedDay,
  selectedDayMetric,
  onSelectDay,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  isDayEditable,
  canEditWeek,
}: WeeklyPlannerProps) {
  const selectedDayInfo =
    weekDays.find((day) => day.index === selectedDay) ?? weekDays[0] ?? null;

  const safeSelectedWeekIndex = Math.max(0, weekStarts.indexOf(weekStart));
  const maxVisibleWeeks = Math.min(5, weekStarts.length);
  const visibleStart = Math.max(
    0,
    Math.min(safeSelectedWeekIndex - 2, Math.max(0, weekStarts.length - maxVisibleWeeks)),
  );
  const visibleWeeks = weekStarts.slice(visibleStart, visibleStart + maxVisibleWeeks);

  const canGoPrev = safeSelectedWeekIndex > 0;
  const canGoNext = safeSelectedWeekIndex < weekStarts.length - 1;

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!canGoPrev) return;
              const previousWeek = weekStarts[safeSelectedWeekIndex - 1];
              if (previousWeek) onWeekStartChange(previousWeek);
            }}
            disabled={!canGoPrev}
            aria-label="Previous week"
            className="rounded-xl border border-white/20 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {visibleWeeks.map((visibleWeekStart, idx) => {
            const isSelected = visibleWeekStart === weekStart;
            const weekNumber = visibleStart + idx + 1;

            return (
              <button
                key={visibleWeekStart}
                type="button"
                onClick={() => onWeekStartChange(visibleWeekStart)}
                className={`rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition sm:text-sm ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-600/80 text-white"
                    : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="block">Week {weekNumber}</span>
                <span className="block text-[10px] text-white/60">
                  {formatWeekRange(visibleWeekStart)}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              if (!canGoNext) return;
              const nextWeek = weekStarts[safeSelectedWeekIndex + 1];
              if (nextWeek) onWeekStartChange(nextWeek);
            }}
            disabled={!canGoNext}
            aria-label="Next week"
            className="rounded-xl border border-white/20 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => (
            <button
              key={day.isoDate}
              type="button"
              onClick={() => onSelectDay(day.index)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                selectedDay === day.index
                  ? "border-emerald-500 bg-emerald-600/80 text-white"
                  : "border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
              }`}
            >
              <p className="text-sm font-semibold">{day.weekdayShort}</p>
              <p className="text-xs opacity-80">{day.dateLabel}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-3">
        <label htmlFor="weekly-quote" className="mb-1 block text-sm font-semibold text-white/90">
          Weekly quote
        </label>
        <Textarea
          id="weekly-quote"
          value={quote}
          onChange={(event) => onQuoteChange(event.target.value)}
          rows={2}
          placeholder="Write a quote that keeps you focused"
          disabled={!canEditWeek}
        />
      </div>

      {selectedDayInfo ? (
        <DayColumn
          day={selectedDayInfo}
          tasks={tasksByDay[selectedDayInfo.index]}
          metric={selectedDayMetric}
          isEditable={isDayEditable(selectedDayInfo.index)}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onRemoveTask={onRemoveTask}
        />
      ) : (
        <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
          No visible days in this week.
        </div>
      )}
    </div>
  );
}
