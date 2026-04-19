interface AreaChartProps {
  values: number[];
  minValue?: number;
  maxValue?: number;
  strokeColor?: string;
  fillColor?: string;
  showGrid?: boolean;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function AreaChart({
  values,
  minValue = 0,
  maxValue = 100,
  strokeColor = "#86efac",
  fillColor = "rgba(134, 239, 172, 0.25)",
  showGrid = true,
  className,
}: AreaChartProps) {
  const safeValues = values.length
    ? values.map((value) => (Number.isFinite(value) ? value : minValue))
    : [0];
  const range = Math.max(1, maxValue - minValue);
  const pointCount = safeValues.length;
  const width = Math.max(100, (pointCount - 1) * 14);
  const height = 120;

  const points = safeValues.map((value, index) => {
    const normalized = clamp(value, minValue, maxValue);
    const x = pointCount === 1 ? 0 : (index / (pointCount - 1)) * width;
    const y = height - ((normalized - minValue) / range) * height;
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className ?? "h-full"}`}
      role="img"
      aria-label="Area chart"
    >
      {showGrid
        ? [0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              y1={height * ratio}
              x2={width}
              y2={height * ratio}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.9"
            />
          ))
        : null}

      <path d={areaPath} fill={fillColor} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
