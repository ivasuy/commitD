export function cn(...inputs: (string | number | boolean | undefined | null)[]): string {
  return inputs
    .filter((x): x is string => x != null && typeof x === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
