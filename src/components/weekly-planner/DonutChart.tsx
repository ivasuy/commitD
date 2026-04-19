interface DonutChartProps {
  percentage: number;
  completed: number;
  total: number;
  size?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function DonutChart({
  percentage,
  completed,
  total,
  size = 180,
}: DonutChartProps) {
  const normalizedPercentage = clamp(Math.round(percentage), 0, 100);
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedPercentage / 100);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 p-2">
      <div className="relative aspect-square w-full max-w-[220px]" style={{ maxWidth: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#86efac"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 250ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-white">
          {normalizedPercentage}%
        </div>
      </div>
      <p className="text-lg font-medium text-white/80">
        {completed} / {total} Completed
      </p>
    </div>
  );
}
