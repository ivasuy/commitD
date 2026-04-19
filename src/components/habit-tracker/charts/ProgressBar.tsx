interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  fillClassName?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  fillClassName,
}: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? value : 0;
  const percentage = clamp((safeValue / safeMax) * 100, 0, 100);

  return (
    <div
      className={`h-5 overflow-hidden rounded border border-white/15 bg-white/15 ${className ?? ""}`}
      aria-hidden="true"
    >
      <div
        className={`h-full rounded bg-emerald-500 ${fillClassName ?? ""}`}
        style={{ width: `${percentage}%`, transition: "width 200ms ease" }}
      />
    </div>
  );
}
