"use client";

import { forwardRef } from "react";
import { inputClass } from "@/src/lib/ui/theme";
import { cn } from "@/src/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          inputClass,
          "resize-none min-h-[80px]",
          error && "border-red-400 focus:ring-red-400/30 focus:border-red-400",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
