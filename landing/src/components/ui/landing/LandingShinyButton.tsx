"use client";

import type React from "react";

import { cn } from "@/src/lib/cn";

interface LandingShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function LandingShinyButton({
  children,
  className,
  type = "button",
  disabled,
  ...rest
}: LandingShinyButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden rounded-lg border-2 border-white/30 px-8 py-4 text-xs uppercase tracking-wide",
        "scale-90 bg-white/20 font-open-sans-custom backdrop-blur-sm",
        "shadow-[0_0_30px_rgba(255,255,255,0.4),inset_0_0_20px_rgba(255,255,255,0.1)]",
        "transition-all duration-300 hover:shadow-[0_0_50px_rgba(255,255,255,0.6),inset_0_0_30px_rgba(255,255,255,0.2)]",
        "disabled:opacity-60",
        className,
      )}
      {...rest}
    >
      <span className="relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{children}</span>
      <span
        className="absolute inset-0 z-0 animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        }}
      />
    </button>
  );
}
