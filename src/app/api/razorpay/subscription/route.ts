import { NextResponse, type NextRequest } from "next/server";

import {
  createSubscription,
  type SubscriptionPlan,
} from "@/src/lib/server/razorpay";
import {
  RouteAuthError,
  requireAuthenticatedUser,
} from "@/src/lib/server/requestAuth";

export const runtime = "nodejs";

interface SubscriptionRequestBody {
  plan?: SubscriptionPlan;
}

function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return value === "weekly" || value === "monthly";
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuthenticatedUser(request);

    let body: SubscriptionRequestBody;

    try {
      body = (await request.json()) as SubscriptionRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!isSubscriptionPlan(body.plan)) {
      return NextResponse.json({ error: "Unsupported plan." }, { status: 400 });
    }

    const subscription = await createSubscription(uid, body.plan);

    return NextResponse.json({
      subscription_id: subscription.subscriptionId,
      key_id: subscription.keyId,
      plan: subscription.plan,
      name: "CommitD",
      description: subscription.description,
    });
  } catch (error) {
    if (error instanceof RouteAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not create subscription.";
    const status = message.toLowerCase().includes("not configured") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
