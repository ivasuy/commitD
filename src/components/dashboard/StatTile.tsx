"use client";

import { ReactNode } from "react";
import { GlassCard } from "@/src/components/ui/glass-card";
import { cn } from "@/src/lib/cn";

interface StatTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export default function StatTile({
  title,
  value,
  subtitle,
  icon,
  className,
}: StatTileProps) {
  return (
    <GlassCard
      className={cn(
        "p-4 text-left",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/70">
            {title}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>
          ) : null}
        </div>
        {icon ? (
          <span className="text-white/50" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
