export interface StackedBarDatum {
  label: string;
  completed: number;
  total: number;
}

interface StackedBarChartProps {
  data: StackedBarDatum[];
}

export default function StackedBarChart({ data }: StackedBarChartProps) {
  const safeData = data.length ? data : [{ label: "", completed: 0, total: 0 }];
  const maxValue = Math.max(1, ...safeData.map((item) => item.total));
  const axisSteps = 5;
  const axisValues = Array.from({ length: axisSteps + 1 }, (_, index) =>
    maxValue - (maxValue * index) / axisSteps,
  );

  return (
    <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
      <div className="relative h-52 text-xs text-white/70">
        {axisValues.map((value, index) => (
          <span
            key={`axis-${index}`}
            className="absolute right-0 -translate-y-1/2 tabular-nums"
            style={{ top: `${(index / axisSteps) * 100}%` }}
          >
            {Number.isInteger(value)
              ? value
              : Number((Math.round(value * 10) / 10).toFixed(1))}
          </span>
        ))}
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-white/60">
          Tasks
        </span>
      </div>

      <div className="min-w-0">
        <div className="relative h-52 rounded-md border border-white/10 bg-white/5 px-2 pt-3 pb-7">
          {Array.from({ length: axisSteps }).map((_, index) => (
            <span
              key={index}
              className="absolute left-0 right-0 border-t border-white/10"
              style={{ top: `${((index + 1) / axisSteps) * 100}%` }}
            />
          ))}

          <div className="absolute inset-x-2 bottom-7 top-3 flex items-end justify-between gap-2">
            {safeData.map((item) => {
              const totalHeight = item.total ? Math.max(4, (item.total / maxValue) * 100) : 0;
              const completedHeight = item.total ? (item.completed / item.total) * 100 : 0;

              return (
                <div key={item.label || "empty"} className="flex h-full min-w-0 flex-1 items-end justify-center">
                  <div
                    className="relative w-full max-w-9 overflow-hidden rounded-t-sm bg-white/15"
                    style={{ height: `${totalHeight}%` }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 bg-emerald-500"
                      style={{
                        height: `${completedHeight}%`,
                        transition: "height 250ms ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute inset-x-2 bottom-1 flex items-start justify-between gap-2">
            {safeData.map((item) => (
              <span
                key={`label-${item.label}`}
                className="flex-1 text-center text-xs font-semibold text-white/85"
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
