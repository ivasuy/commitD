import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import {
  extractProfileRecord,
  serializeEntitlementProfile,
} from "@/src/lib/server/entitlementProfile";
import { getAdminFirestore } from "@/src/lib/server/firebaseAdmin";
import {
  fetchSubscription,
  resolvePlanFromPlanId,
  type SubscriptionPlan,
  verifySubscriptionSignature,
} from "@/src/lib/server/razorpay";
import {
  RouteAuthError,
  requireAuthenticatedUser,
} from "@/src/lib/server/requestAuth";

export const runtime = "nodejs";

interface VerifySubscriptionRequestBody {
  plan?: SubscriptionPlan;
  razorpay_subscription_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

interface RazorpaySubscriptionLike {
  id?: string;
  plan_id?: string;
  current_end?: number;
  notes?: {
    uid?: string;
    plan?: string;
  };
}

function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return value === "weekly" || value === "monthly";
}

function hasValidPayload(
  payload: VerifySubscriptionRequestBody,
): payload is Required<Pick<VerifySubscriptionRequestBody, "razorpay_subscription_id" | "razorpay_payment_id" | "razorpay_signature">> &
  VerifySubscriptionRequestBody {
  return Boolean(
    payload.razorpay_subscription_id &&
      payload.razorpay_payment_id &&
      payload.razorpay_signature,
  );
}

function fallbackPeriodEnd(plan: SubscriptionPlan, now: Date): Date {
  const periodEnd = new Date(now);

  if (plan === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return periodEnd;
  }

  periodEnd.setDate(periodEnd.getDate() + 7);
  return periodEnd;
}

function deriveCurrentPeriodEnd(subscription: RazorpaySubscriptionLike, plan: SubscriptionPlan, now: Date): Date {
  if (typeof subscription.current_end === "number" && subscription.current_end > 0) {
    return new Date(subscription.current_end * 1000);
  }

  return fallbackPeriodEnd(plan, now);
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuthenticatedUser(request);

    let body: VerifySubscriptionRequestBody;

    try {
      body = (await request.json()) as VerifySubscriptionRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!hasValidPayload(body)) {
      return NextResponse.json({ error: "Missing required Razorpay fields." }, { status: 400 });
    }

    const isSignatureValid = verifySubscriptionSignature({
      razorpay_subscription_id: body.razorpay_subscription_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid subscription signature." }, { status: 400 });
    }

    const subscriptionRaw = (await fetchSubscription(body.razorpay_subscription_id)) as RazorpaySubscriptionLike;
    const subscription = subscriptionRaw ?? {};

    if (subscription.id && subscription.id !== body.razorpay_subscription_id) {
      return NextResponse.json({ error: "Subscription mismatch." }, { status: 400 });
    }

    const resolvedPlanFromId = resolvePlanFromPlanId(subscription.plan_id);
    const requestedPlan = isSubscriptionPlan(body.plan) ? body.plan : null;
    const resolvedPlanFromNotes = isSubscriptionPlan(subscription.notes?.plan)
      ? subscription.notes.plan
      : null;
    const resolvedPlan =
      resolvedPlanFromId ??
      resolvedPlanFromNotes ??
      requestedPlan;

    if (!resolvedPlan) {
      return NextResponse.json({ error: "Could not resolve subscription plan." }, { status: 400 });
    }

    if (requestedPlan && requestedPlan !== resolvedPlan) {
      return NextResponse.json({ error: "Plan mismatch for subscription." }, { status: 400 });
    }

    if (subscription.notes?.uid && subscription.notes.uid !== uid) {
      return NextResponse.json({ error: "Subscription user mismatch." }, { status: 403 });
    }

    const now = new Date();
    const currentPeriodEnd = deriveCurrentPeriodEnd(subscription, resolvedPlan, now);

    const firestore = getAdminFirestore();
    const userRef = firestore.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const profile = extractProfileRecord(userSnap.data());

    await userRef.set(
      {
        profile: {
          plan: resolvedPlan,
          planStatus: "active",
          currentPeriodEnd: Timestamp.fromDate(currentPeriodEnd),
          razorpaySubscriptionId: body.razorpay_subscription_id,
          razorpayPaymentId: body.razorpay_payment_id,
          planPending: FieldValue.delete(),
          razorpaySubscriptionIdPending: FieldValue.delete(),
          cancelAtPeriodEnd: FieldValue.delete(),
          canceledAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      profile: serializeEntitlementProfile({
        ...profile,
        plan: resolvedPlan,
        planStatus: "active",
        currentPeriodEnd,
        razorpaySubscriptionId: body.razorpay_subscription_id,
        razorpayPaymentId: body.razorpay_payment_id,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: now,
      }),
    });
  } catch (error) {
    if (error instanceof RouteAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not verify subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
