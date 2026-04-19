"use client";

import { useEffect } from "react";

export function useSaveOnBlur(onFlush: () => void) {
  useEffect(() => {
    const handler = (event: FocusEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        onFlush();
      }
    };

    document.addEventListener("focusout", handler);

    return () => {
      document.removeEventListener("focusout", handler);
    };
  }, [onFlush]);
}
