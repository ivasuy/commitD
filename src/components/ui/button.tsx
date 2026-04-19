"use client";

import { forwardRef } from "react";
import { cn } from "@/src/lib/cn";

type ButtonVariant = "glass-outline" | "ghost" | "default" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  "glass-outline":
    "rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/10 hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  ghost:
    "rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
  default:
    "rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
  destructive:
    "rounded-lg px-2 py-1.5 border border-red-300/25 bg-red-500/10 text-sm leading-none text-red-100 transition hover:border-red-300/45 hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("font-ui", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export { Button };
