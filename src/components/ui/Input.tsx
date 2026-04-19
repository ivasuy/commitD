"use client";

import { forwardRef } from "react";
import { inputClass } from "@/src/lib/ui/theme";
import { cn } from "@/src/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          inputClass,
          error && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
