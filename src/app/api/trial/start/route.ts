import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import {
  hasActivePaidPlan,
  isTrialConfigured,
  normalizePlan,
} from "@/src/lib/entitlement";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/src/lib/firebase/admin";
import {
  extractProfileRecord,
  serializeEntitlementProfile,
  type SerializedEntitlementProfile,
} from "@/src/lib/server/entitlementProfile";

export const runtime = "nodejs";

const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      profileEntitlement: null,
      message: "Unauthorized",
    },
    { status: 401 },
  );
}

function successResponse(profileEntitlement: SerializedEntitlementProfile) {
  return NextResponse.json({
    success: true,
    profileEntitlement,
  });
}

function failureResponse(message: string) {
  return NextResponse.json({
    success: false,
    profileEntitlement: null,
    message,
  });
}

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request);

    if (!token) {
      return unauthorizedResponse();
    }

    let uid: string;

    try {
      const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch {
      return unauthorizedResponse();
    }

    const firestore = getFirebaseAdminFirestore();
    const userRef = firestore.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const profile = extractProfileRecord(userSnap.data());
    const now = new Date();

    if (isTrialConfigured(profile) || hasActivePaidPlan(profile, now)) {
      return successResponse(serializeEntitlementProfile(profile));
    }

    const trialStartedAt = now;
    const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_MS);
    const currentPlan = normalizePlan(profile.plan);

    await userRef.set(
      {
        profile: {
          plan: currentPlan,
          trialStartedAt: FieldValue.serverTimestamp(),
          trialEndsAt: Timestamp.fromDate(trialEndsAt),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    return successResponse(
      serializeEntitlementProfile({
        ...profile,
        plan: currentPlan,
        trialStartedAt,
        trialEndsAt,
        updatedAt: now,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not start trial.";
    return failureResponse(message);
  }
}
