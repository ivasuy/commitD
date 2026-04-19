"use client";

export interface StatTileProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default:
    "border-white/15 bg-white/5 text-white/90",
  primary:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger:
    "border-red-500/30 bg-red-500/10 text-red-300",
};

export default function StatTile({
  title,
  value,
  subtitle,
  variant = "default",
  className = "",
}: StatTileProps) {
  return (
    <div
      className={
        "rounded-xl border p-3 transition-shadow duration-200 hover:shadow-lg " +
        variantStyles[variant] +
        " " +
        className
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
        {title}
      </p>
      <p className="mt-1 text-lg font-bold sm:text-xl">{value}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-white/60">{subtitle}</p>
      ) : null}
    </div>
  );
}
