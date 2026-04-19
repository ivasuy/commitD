"use client";

import { useEffect, useState } from "react";

import { getLocalNow, toLocalYM, toLocalYMD } from "@/src/lib/time/localTime";

interface LocalTodayState {
  todayYmd: string;
  monthKeyYm: string;
  year: number;
}

function buildLocalTodayState(): LocalTodayState {
  if (typeof window === "undefined") {
    return {
      todayYmd: "1970-01-01",
      monthKeyYm: "1970-01",
      year: 1970,
    };
  }

  const now = getLocalNow();

  return {
    todayYmd: toLocalYMD(now),
    monthKeyYm: toLocalYM(now),
    year: now.getFullYear(),
  };
}

export function useLocalToday(): LocalTodayState {
  const [state, setState] = useState<LocalTodayState>(buildLocalTodayState);

  useEffect(() => {
    const syncToday = () => {
      const next = buildLocalTodayState();

      setState((previous) =>
        previous.todayYmd === next.todayYmd
          ? previous
          : next,
      );
    };

    const intervalId = window.setInterval(syncToday, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncToday();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return state;
}
