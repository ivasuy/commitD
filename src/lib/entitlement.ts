export type LockinPlan = "none" | "weekly" | "monthly" | "lifetime";
export type LockinPlanStatus = "active" | "expired" | "canceled";

export interface EntitlementProfileFields {
  trialStartedAt?: unknown;
  trialEndsAt?: unknown;
  plan?: LockinPlan;
  planStatus?: LockinPlanStatus;
  currentPeriodEnd?: unknown;
  razorpaySubscriptionId?: string | null;
  razorpayPaymentId?: string | null;
  updatedAt?: unknown;
}

interface TimestampLike {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

const PLAN_VALUES: LockinPlan[] = ["none", "weekly", "monthly", "lifetime"];
const PLAN_STATUS_VALUES: LockinPlanStatus[] = ["active", "expired", "canceled"];

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

export function parseDateLike(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const candidate = value as TimestampLike;

  if (typeof candidate.toDate === "function") {
    const parsed = candidate.toDate();
    return isValidDate(parsed) ? parsed : null;
  }

  if (typeof candidate.seconds === "number") {
    const millis = candidate.seconds * 1000 + (candidate.nanoseconds ?? 0) / 1_000_000;
    const parsed = new Date(millis);
    return isValidDate(parsed) ? parsed : null;
  }

  return null;
}

export function normalizePlan(value: unknown): LockinPlan {
  if (typeof value !== "string") {
    return "none";
  }

  return PLAN_VALUES.includes(value as LockinPlan) ? (value as LockinPlan) : "none";
}

export function normalizePlanStatus(value: unknown): LockinPlanStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  return PLAN_STATUS_VALUES.includes(value as LockinPlanStatus)
    ? (value as LockinPlanStatus)
    : null;
}

export function hasPaidPlan(profile: EntitlementProfileFields | null | undefined): boolean {
  return normalizePlan(profile?.plan) !== "none";
}

export function hasActivePaidPlan(
  profile: EntitlementProfileFields | null | undefined,
  now = new Date(),
): boolean {
  const plan = normalizePlan(profile?.plan);

  if (plan === "lifetime") {
    return true;
  }

  if (plan !== "weekly" && plan !== "monthly") {
    return false;
  }

  const status = normalizePlanStatus(profile?.planStatus);
  const currentPeriodEnd = parseDateLike(profile?.currentPeriodEnd);

  return Boolean(
    status === "active" &&
      currentPeriodEnd &&
      currentPeriodEnd.getTime() >= now.getTime(),
  );
}

export function isTrialConfigured(profile: EntitlementProfileFields | null | undefined): boolean {
  return parseDateLike(profile?.trialStartedAt) !== null || parseDateLike(profile?.trialEndsAt) !== null;
}

export function shouldStartTrial(profile: EntitlementProfileFields | null | undefined): boolean {
  return !hasPaidPlan(profile) && !isTrialConfigured(profile);
}

export function hasAccess(profile: EntitlementProfileFields | null | undefined, now = new Date()): boolean {
  if (hasActivePaidPlan(profile, now)) {
    return true;
  }

  const trialEndsAt = parseDateLike(profile?.trialEndsAt);

  return trialEndsAt ? trialEndsAt.getTime() >= now.getTime() : false;
}

export function getTrialHoursRemaining(
  profile: EntitlementProfileFields | null | undefined,
  now = new Date(),
): number | null {
  const trialEndsAt = parseDateLike(profile?.trialEndsAt);

  if (!trialEndsAt) {
    return null;
  }

  const remainingMs = trialEndsAt.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / (1000 * 60 * 60));
}
