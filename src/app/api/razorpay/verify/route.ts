import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import {
  extractProfileRecord,
  serializeEntitlementProfile,
} from "@/src/lib/server/entitlementProfile";
import { getAdminFirestore } from "@/src/lib/server/firebaseAdmin";
import { verifyLifetimeSignature } from "@/src/lib/server/razorpay";
import {
  RouteAuthError,
  requireAuthenticatedUser,
} from "@/src/lib/server/requestAuth";

export const runtime = "nodejs";

interface VerifyRequestBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

function hasValidPayload(payload: VerifyRequestBody): payload is Required<VerifyRequestBody> {
  return Boolean(
    payload.razorpay_order_id &&
      payload.razorpay_payment_id &&
      payload.razorpay_signature,
  );
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuthenticatedUser(request);

    let body: VerifyRequestBody;

    try {
      body = (await request.json()) as VerifyRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!hasValidPayload(body)) {
      return NextResponse.json({ error: "Missing required Razorpay fields." }, { status: 400 });
    }

    const isSignatureValid = verifyLifetimeSignature(body);

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const userRef = firestore.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const profile = extractProfileRecord(userSnap.data());

    await userRef.set(
      {
        profile: {
          plan: "lifetime",
          planStatus: "active",
          currentPeriodEnd: null,
          razorpaySubscriptionId: null,
          razorpayPaymentId: body.razorpay_payment_id,
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
        plan: "lifetime",
        planStatus: "active",
        currentPeriodEnd: null,
        razorpaySubscriptionId: null,
        razorpayPaymentId: body.razorpay_payment_id,
        updatedAt: now,
      }),
    });
  } catch (error) {
    if (error instanceof RouteAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not verify payment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
