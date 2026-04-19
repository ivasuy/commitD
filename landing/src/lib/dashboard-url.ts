const DEFAULT_DASHBOARD_URL = "http://localhost:3001";

export function getDashboardUrl(): string {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? DEFAULT_DASHBOARD_URL;
  return raw.replace(/\/$/, "");
}
