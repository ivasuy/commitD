"use client";

import { cn } from "@/src/lib/cn";

interface MiniDonutProps {
  done: number;
  total: number;
  size?: number;
  className?: string;
  doneColor?: string;
  remainingColor?: string;
}

export default function MiniDonut({
  done,
  total,
  size = 48,
  className,
  doneColor = "rgba(255,255,255,0.7)",
  remainingColor = "rgba(255,255,255,0.15)",
}: MiniDonutProps) {
  const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (percent / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={remainingColor}
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={doneColor}
        strokeWidth={6}
        strokeDasharray={`${strokeDash} ${circumference}`}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}
