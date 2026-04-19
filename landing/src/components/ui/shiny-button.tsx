"use client";

import * as React from "react";
import { cn } from "@/src/lib/cn";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({
  children,
  className,
  type = "button",
  disabled,
  onClick,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative rounded-lg px-8 py-4 uppercase tracking-wide overflow-hidden font-ui text-xs scale-90",
        "bg-white/20 backdrop-blur-sm border-2 border-white/30",
        "shadow-[0_0_30px_rgba(255,255,255,0.4),inset_0_0_20px_rgba(255,255,255,0.1)]",
        "hover:shadow-[0_0_50px_rgba(255,255,255,0.6),inset_0_0_30px_rgba(255,255,255,0.2)]",
        "transition-all duration-300",
        className,
      )}
      {...rest}
    >
      <span className="relative z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        {children}
      </span>

      <span
        className="absolute inset-0 z-0 animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        }}
      />
    </button>
  );
};
