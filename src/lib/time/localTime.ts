function toPadded(value: number): string {
  return String(value).padStart(2, "0");
}

function parseYmdParts(ymd: string): { year: number; month: number; day: number } | null {
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

function parseYmParts(ym: string): { year: number; month: number } | null {
  const match = ym.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  return {
    year,
    month,
  };
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getLocalNow(): Date {
  if (typeof window === "undefined") {
    return new Date(1970, 0, 1);
  }

  return new Date();
}

export function toLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = toPadded(d.getMonth() + 1);
  const day = toPadded(d.getDate());
  return `${year}-${month}-${day}`;
}

export function toLocalYM(d: Date): string {
  const year = d.getFullYear();
  const month = toPadded(d.getMonth() + 1);
  return `${year}-${month}`;
}

export function parseLocalYMD(ymd: string): Date {
  const parsed = parseYmdParts(ymd);

  if (!parsed) {
    return startOfLocalDay(getLocalNow());
  }

  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

export function addDaysLocal(ymd: string, n: number): string {
  const date = parseLocalYMD(ymd);
  date.setDate(date.getDate() + n);
  return toLocalYMD(date);
}

export function isBeforeLocal(aYmd: string, bYmd: string): boolean {
  return parseLocalYMD(aYmd).getTime() < parseLocalYMD(bYmd).getTime();
}

export function isSameLocalDay(aYmd: string, bYmd: string): boolean {
  return toLocalYMD(parseLocalYMD(aYmd)) === toLocalYMD(parseLocalYMD(bYmd));
}

export function prevMonthKey(ym: string): string {
  const parsed = parseYmParts(ym);

  if (!parsed) {
    const now = getLocalNow();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    return toLocalYM(currentMonthDate);
  }

  const monthStart = new Date(parsed.year, parsed.month - 1, 1);
  monthStart.setMonth(monthStart.getMonth() - 1);
  return toLocalYM(monthStart);
}
