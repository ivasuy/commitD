"use client";

import * as React from "react";

import { cn } from "@/src/lib/cn";

type LandingButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type LandingButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "icon"
  | "icon-sm"
  | "icon-lg";

interface LandingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LandingButtonVariant;
  size?: LandingButtonSize;
}

const variantClasses: Record<LandingButtonVariant, string> = {
  default: "bg-white text-black hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-500",
  outline: "border border-white/20 bg-white/5 text-white hover:bg-white/10",
  secondary: "bg-white/10 text-white hover:bg-white/15",
  ghost: "text-white hover:bg-white/10",
  link: "text-white underline-offset-4 hover:underline",
};

const sizeClasses: Record<LandingButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
  "icon-lg": "h-10 w-10",
};

export function LandingButton({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: LandingButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
