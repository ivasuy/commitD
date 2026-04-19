"use client";

import { forwardRef } from "react";
import { selectClass } from "@/src/lib/ui/theme";
import { cn } from "@/src/lib/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          selectClass,
          error && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";

export default Select;
