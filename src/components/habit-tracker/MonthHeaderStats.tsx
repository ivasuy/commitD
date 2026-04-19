import Input from "@/src/components/ui/Input";
import Select from "@/src/components/ui/Select";
import StatTile from "@/src/components/ui/StatTile";
import ProgressBar from "@/src/components/habit-tracker/charts/ProgressBar";
import { MONTH_NAMES, toYearMonthKey } from "@/src/lib/date";
import { isMonthBeforeFirstEntry } from "@/src/lib/date/firstEntryWindow";

interface MonthHeaderStatsProps {
  monthIndex: number;
  year: number;
  firstEntryDate: Date;
  habitsCount: number;
  completedChecks: number;
  progressPercent: number;
  onMonthChange: (monthIndex: number) => void;
  onYearChange: (year: number) => void;
}

export default function MonthHeaderStats({
  monthIndex,
  year,
  firstEntryDate,
  habitsCount,
  completedChecks,
  progressPercent,
  onMonthChange,
  onYearChange,
}: MonthHeaderStatsProps) {
  const minYear = firstEntryDate.getFullYear();
  const monthOptions = MONTH_NAMES.map((month, index) => ({
    index,
    month,
  })).filter(({ index }) =>
    !isMonthBeforeFirstEntry(toYearMonthKey(year, index), firstEntryDate),
  );

  return (
    <div className="w-full">
      <div className="grid gap-3 md:grid-cols-[220px_1fr_1fr_1.6fr_1fr] md:items-center">
        <div className="rounded-xlpx-3 py-2">
          <label className="sr-only" htmlFor="habit-tracker-month">
            Month
          </label>
          <Select
            id="habit-tracker-month"
            value={monthIndex}
            onChange={(event) => onMonthChange(Number(event.target.value))}
            className="text-xl font-medium md:text-2xl"
          >
            {monthOptions.map(({ month, index }) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </Select>

          <label className="sr-only" htmlFor="habit-tracker-year">
            Year
          </label>
          <Input
            id="habit-tracker-year"
            type="number"
            min={minYear}
            max={9999}
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="mt-1.5"
          />
        </div>

        <StatTile title="Number of habits" value={habitsCount} />
        <StatTile title="Completed habits" value={completedChecks} />

        <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-3">
          <p className="mb-1 text-center text-sm font-semibold text-white/60">Progress</p>
          <ProgressBar value={progressPercent} className="h-6" />
        </div>

        <StatTile title="Progress %" value={`${progressPercent.toFixed(2)}%`} />
      </div>
    </div>
  );
}
