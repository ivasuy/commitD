export function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readRawStorageItem(key: string): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function readStorageJSON<T>(key: string, fallback: T): T {
  const raw = readRawStorageItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorageJSON<T>(key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors.
  }
}

export function readStorageString(key: string, fallback = ""): string {
  const raw = readRawStorageItem(key);
  return raw ?? fallback;
}

export function writeStorageString(key: string, value: string): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors.
  }
}

export function removeStorageItem(key: string): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage write errors.
  }
}

export function listStorageKeys(prefix = ""): string[] {
  if (!canUseStorage()) {
    return [];
  }

  const keys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key) {
      continue;
    }

    if (!prefix || key.startsWith(prefix)) {
      keys.push(key);
    }
  }

  return keys;
}

type Debounced<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 300,
): Debounced<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;

  const debounced = ((...args: Args) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;

      if (lastArgs) {
        callback(...lastArgs);
        lastArgs = null;
      }
    }, delay);
  }) as Debounced<Args>;

  debounced.cancel = () => {
    if (!timeoutId) {
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
  };

  debounced.flush = () => {
    if (!lastArgs) {
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    callback(...lastArgs);
    lastArgs = null;
  };

  return debounced;
}
