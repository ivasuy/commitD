import * as React from "react";

import { cn } from "@/src/lib/cn";

export function LandingTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-16 w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-base",
        "placeholder:text-gray-400 outline-none transition",
        "focus:border-white/35 focus:ring-2 focus:ring-white/20",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
