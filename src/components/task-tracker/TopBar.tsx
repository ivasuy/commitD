import Input from "@/src/components/ui/Input";
import StatTile from "@/src/components/ui/StatTile";
import { SegmentedProgress } from "@/src/components/ui/progress-bar";
import { formatUSDate } from "@/src/lib/task-tracker/date";
import type { TaskTrackerCounters } from "@/src/lib/task-tracker/types";

interface TopBarProps {
  selectedDate: string;
  onDateChange?: (dateISO: string) => void;
  counters: TaskTrackerCounters;
  progressPercent?: number;
  progressLabel?: string;
}

export default function TopBar({
  selectedDate,
  onDateChange,
  counters,
  progressPercent,
  progressLabel,
}: TopBarProps) {
  return (
    <div className="w-full">
      <div className="grid gap-3 md:grid-cols-[11rem_12rem_100px_100px_100px_120px_100px] md:items-center">
        <div className="min-w-0 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5">
          <label htmlFor="task-tracker-date" className="block text-xs font-semibold text-white/60">
            Date
          </label>
          {onDateChange ? (
            <Input
              id="task-tracker-date"
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="min-h-0 w-full border-0 bg-transparent py-0 pr-8 text-sm shadow-none focus:ring-0"
              style={{ colorScheme: "dark" }}
            />
          ) : (
            <p className="text-sm font-medium text-white/90">{formatUSDate(selectedDate)}</p>
          )}
        </div>

        {typeof progressPercent === "number" ? (
          <div className="min-w-0 overflow-hidden rounded-xl border border-white/15 bg-white/5 px-3 py-2">
            <SegmentedProgress
              value={Math.min(100, Math.max(0, progressPercent))}
              segments={20}
              label={progressLabel ?? "Progress"}
              showPercentage={true}
              showDemo={false}
              variant="on-dark"
              className="gap-1"
            />
          </div>
        ) : (
          <div />
        )}

        <StatTile title="Today" value={counters.today} variant="success" className="py-2" />
        <StatTile title="Total" value={counters.totalTasks} className="py-2" />
        <StatTile title="Overdue" value={counters.overdue} variant="danger" className="py-2" />
        <StatTile title="Not Done" value={counters.notCompleted} className="py-2" />
        <StatTile title="Done" value={counters.completed} variant="success" className="py-2" />
      </div>
    </div>
  );
}
