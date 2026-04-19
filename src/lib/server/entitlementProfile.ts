import {
  normalizePlan,
  normalizePlanStatus,
  parseDateLike,
  type LockinPlan,
  type LockinPlanStatus,
} from "@/src/lib/entitlement";

export type ProfileRecord = Record<string, unknown>;

export interface SerializedEntitlementProfile {
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  plan: LockinPlan;
  planStatus: LockinPlanStatus | null;
  currentPeriodEnd: string | null;
  razorpaySubscriptionId: string | null;
  razorpayPaymentId: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  updatedAt: string | null;
}

function toIso(value: unknown): string | null {
  const parsed = parseDateLike(value);
  return parsed ? parsed.toISOString() : null;
}

export function extractProfileRecord(userDocData: unknown): ProfileRecord {
  if (!userDocData || typeof userDocData !== "object") {
    return {};
  }

  const profile = (userDocData as Record<string, unknown>).profile;

  if (!profile || typeof profile !== "object") {
    return {};
  }

  return profile as ProfileRecord;
}

export function serializeEntitlementProfile(profile: ProfileRecord): SerializedEntitlementProfile {
  return {
    trialStartedAt: toIso(profile.trialStartedAt),
    trialEndsAt: toIso(profile.trialEndsAt),
    plan: normalizePlan(profile.plan),
    planStatus: normalizePlanStatus(profile.planStatus),
    currentPeriodEnd: toIso(profile.currentPeriodEnd),
    razorpaySubscriptionId:
      typeof profile.razorpaySubscriptionId === "string" ? profile.razorpaySubscriptionId : null,
    razorpayPaymentId:
      typeof profile.razorpayPaymentId === "string" ? profile.razorpayPaymentId : null,
    cancelAtPeriodEnd: profile.cancelAtPeriodEnd === true,
    canceledAt: toIso(profile.canceledAt),
    updatedAt: toIso(profile.updatedAt),
  };
}
