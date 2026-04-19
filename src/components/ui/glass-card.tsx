"use client";

import { cn } from "@/src/lib/cn";
import DotPattern from "@/src/components/ui/dot-pattern";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-visible rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md",
        "transition-all duration-300 hover:border-white/25 hover:bg-white/8 hover:shadow-lg",
        "hover:-translate-y-0.5 hover:scale-[1.01] hover:z-20",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
        <DotPattern className="opacity-60" />
        <span
          className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-2 border-t-2 border-white/20"
          aria-hidden
        />
        <span
          className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-2 border-t-2 border-white/20"
          aria-hidden
        />
        <span
          className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-2 border-l-2 border-white/20"
          aria-hidden
        />
        <span
          className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-2 border-r-2 border-white/20"
          aria-hidden
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
