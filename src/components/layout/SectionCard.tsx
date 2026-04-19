"use client";

import type { ReactNode } from "react";

import { GlassCard } from "@/src/components/ui";
import { cn } from "@/src/lib/cn";

interface SectionCardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <GlassCard className={cn("min-w-0 p-4 sm:p-5", className)}>
      {title || actions ? (
        <div className="mb-3 flex items-start justify-between gap-4">
          {title ? (
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
            </div>
          ) : null}
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className="min-w-0">{children}</div>
    </GlassCard>
  );
}
