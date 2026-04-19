import * as React from "react";

import { cn } from "@/src/lib/cn";

export function LandingLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        className,
      )}
      {...props}
    />
  );
}
