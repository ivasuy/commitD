import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import {
  extractProfileRecord,
  serializeEntitlementProfile,
} from "@/src/lib/server/entitlementProfile";
import { getAdminFirestore } from "@/src/lib/server/firebaseAdmin";
import { cancelSubscriptionAtCycleEnd } from "@/src/lib/server/razorpay";
import {
  RouteAuthError,
  requireAuthenticatedUser,
} from "@/src/lib/server/requestAuth";

export const runtime = "nodejs";

function hasActiveRecurringPlan(plan: unknown): plan is "weekly" | "monthly" {
  return plan === "weekly" || plan === "monthly";
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuthenticatedUser(request);

    const firestore = getAdminFirestore();
    const userRef = firestore.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const profile = extractProfileRecord(userSnap.data());

    const plan = profile.plan;
    const subscriptionId =
      typeof profile.razorpaySubscriptionId === "string" ? profile.razorpaySubscriptionId : null;
    const cancelAtPeriodEnd = profile.cancelAtPeriodEnd === true;
    const planStatus = profile.planStatus;

    if (
      !hasActiveRecurringPlan(plan) ||
      !subscriptionId ||
      planStatus === "canceled" ||
      cancelAtPeriodEnd
    ) {
      return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
    }

    await cancelSubscriptionAtCycleEnd(subscriptionId);

    await userRef.set(
      {
        profile: {
          planStatus: "active",
          cancelAtPeriodEnd: true,
          canceledAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    const now = new Date();

    return NextResponse.json({
      success: true,
      profile: serializeEntitlementProfile({
        ...profile,
        planStatus: "active",
        cancelAtPeriodEnd: true,
        canceledAt: now,
        updatedAt: now,
      }),
    });
  } catch (error) {
    if (error instanceof RouteAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
