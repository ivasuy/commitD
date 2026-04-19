import DonutChart from "@/src/components/weekly-planner/DonutChart";
import StackedBarChart from "@/src/components/weekly-planner/StackedBarChart";
import type { WeekDayInfo } from "@/src/lib/weekly-planner/date";
import type { DayMetric, OverallMetric } from "@/src/lib/weekly-planner/metrics";

interface OverallProgressProps {
  weekDays: WeekDayInfo[];
  dayMetricsList: DayMetric[];
  overall: OverallMetric;
  title?: string | null;
}

export default function OverallProgress({
  weekDays,
  dayMetricsList,
  overall,
  title = "Overall Progress",
}: OverallProgressProps) {
  return (
    <div className="w-full min-w-0">
      {title ? (
        <div className="rounded-xl bg-emerald-600/80 px-3 py-1.5 text-center text-lg font-semibold text-white">
          {title}
        </div>
      ) : null}

      <div className={`${title ? "mt-4" : ""} flex min-w-0 flex-col gap-4 lg:flex-row`}>
        <div className="min-w-0 flex-1 rounded-xl p-2 overflow-hidden">
          <StackedBarChart
            data={dayMetricsList.map((metric, index) => ({
              label: weekDays[index]?.weekdayShort ?? "",
              completed: metric.completed,
              total: metric.total,
            }))}
          />
        </div>

        <div className="flex min-w-[220px] items-center justify-center rounded-xl  p-2 lg:w-[240px]">
          <DonutChart
            percentage={overall.percent}
            completed={overall.completed}
            total={overall.total}
          />
        </div>
      </div>
    </div>
  );
}
