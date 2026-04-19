"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/src/lib/cn";

export interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function GlassModal({
  open,
  onClose,
  title,
  children,
  className,
  bodyClassName,
}: GlassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "glass-modal-title" : undefined}
      className="fixed inset-0 z-1100 flex items-center justify-center overflow-y-auto px-4 py-8"
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        className={cn(
          "relative z-10 my-auto w-full max-w-5xl overflow-visible rounded-2xl border border-white/15 bg-black/50 text-white shadow-2xl backdrop-blur-xl",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          {title ? (
            <h2 id="glass-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
        <div
          className={cn(
            "px-5 py-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
