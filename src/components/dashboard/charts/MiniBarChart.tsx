"use client";

import { cn } from "@/src/lib/cn";

interface MiniBarChartProps {
  values: number[];
  max?: number;
  className?: string;
  barClassName?: string;
}

export default function MiniBarChart({
  values,
  max = 100,
  className,
  barClassName = "fill-white/40",
}: MiniBarChartProps) {
  const effectiveMax = Math.max(max, 1);

  return (
    <div
      className={cn("flex h-10 w-full items-end gap-0.5", className)}
      role="img"
      aria-label={`Bar chart: ${values.join(", ")}`}
    >
      {values.map((value, i) => {
        const heightPercent = Math.min(100, (value / effectiveMax) * 100);
        return (
          <div
            key={i}
            className={cn("flex-1 min-w-0 rounded-t transition-all duration-300", barClassName)}
            style={{
              height: `${heightPercent}%`,
              minHeight: value > 0 ? 4 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
