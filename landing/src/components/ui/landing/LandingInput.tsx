import * as React from "react";

import { cn } from "@/src/lib/cn";

export function LandingInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-white/20 bg-transparent px-3 py-1 text-base",
        "placeholder:text-gray-400 outline-none transition",
        "focus:border-white/35 focus:ring-2 focus:ring-white/20",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
