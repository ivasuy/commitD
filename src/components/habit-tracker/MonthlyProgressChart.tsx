import AreaChart from "@/src/components/habit-tracker/charts/AreaChart";

interface MonthlyProgressChartProps {
  dailyProgressPercent: number[];
  className?: string;
}

export default function MonthlyProgressChart({
  dailyProgressPercent,
  className,
}: MonthlyProgressChartProps) {
  return (
    <div className={`relative h-full w-full pl-8 ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-y-2 left-1 flex flex-col justify-between text-[10px] text-white/60">
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
      </div>

      <div className="h-full w-full">
        <AreaChart
          values={dailyProgressPercent}
          maxValue={100}
          minValue={0}
          strokeColor="#7bb26a"
          fillColor="rgba(140, 186, 120, 0.28)"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
