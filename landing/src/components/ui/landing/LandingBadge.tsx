import * as React from "react";

import { cn } from "@/src/lib/cn";

type LandingBadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface LandingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: LandingBadgeVariant;
}

const variantClasses: Record<LandingBadgeVariant, string> = {
  default: "border-transparent bg-white text-black",
  secondary: "border-transparent bg-white/10 text-white",
  destructive: "border-transparent bg-red-600 text-white",
  outline: "border-white/20 text-white",
};

export function LandingBadge({ className, variant = "default", ...props }: LandingBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
