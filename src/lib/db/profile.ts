import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type FieldValue,
} from "firebase/firestore";

import { getFirstEntryDate } from "@/src/lib/date/firstEntryWindow";
import { firestore } from "@/src/lib/firebase/client";
import type { LockinPlan, LockinPlanStatus } from "@/src/lib/entitlement";

export interface UserProfile {
  createdAt?: unknown;
  firstEntryAt?: unknown;
  email?: string;
  provider?: string;
  lastActiveAt?: unknown;
  trialStartedAt?: unknown;
  trialEndsAt?: unknown;
  plan?: LockinPlan;
  planStatus?: LockinPlanStatus;
  currentPeriodEnd?: unknown;
  razorpaySubscriptionId?: string | null;
  razorpayPaymentId?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: unknown;
  updatedAt?: unknown;
}

type ProfileListener = (profile: UserProfile) => void;

const profileCache = new Map<string, UserProfile>();
const profileRequests = new Map<string, Promise<UserProfile>>();
const profileListeners = new Map<string, Set<ProfileListener>>();

function normalizeProfile(value: unknown): UserProfile {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as UserProfile;
}

function hasProfileData(profile: UserProfile): boolean {
  return Object.keys(profile).length > 0;
}

function emitProfile(uid: string, profile: UserProfile): void {
  profileCache.set(uid, profile);

  const listeners = profileListeners.get(uid);

  if (!listeners || listeners.size === 0) {
    return;
  }

  listeners.forEach((listener) => {
    listener(profile);
  });
}

async function fetchUserProfile(uid: string): Promise<UserProfile> {
  const userRef = doc(firestore, "users", uid);
  const userSnap = await getDoc(userRef);
  const userProfile = normalizeProfile(userSnap.data()?.profile);

  if (hasProfileData(userProfile)) {
    return userProfile;
  }

  const legacyRef = doc(firestore, "users", uid, "profile", "default");
  const legacySnap = await getDoc(legacyRef);

  if (!legacySnap.exists()) {
    return userProfile;
  }

  const legacyProfile = normalizeProfile(legacySnap.data());

  if (!hasProfileData(legacyProfile)) {
    return userProfile;
  }

  const merged = {
    ...legacyProfile,
    ...userProfile,
  } satisfies UserProfile;

  await setDoc(
    userRef,
    {
      profile: merged,
    },
    { merge: true },
  );

  return merged;
}

export async function loadUserProfile(uid: string): Promise<UserProfile> {
  const cached = profileCache.get(uid);

  if (cached) {
    return cached;
  }

  const pending = profileRequests.get(uid);

  if (pending) {
    return pending;
  }

  const request = fetchUserProfile(uid)
    .then((profile) => {
      emitProfile(uid, profile);
      profileRequests.delete(uid);
      return profile;
    })
    .catch((error) => {
      profileRequests.delete(uid);
      throw error;
    });

  profileRequests.set(uid, request);
  return request;
}

export function subscribeUserProfile(uid: string, listener: ProfileListener): () => void {
  const listeners = profileListeners.get(uid) ?? new Set<ProfileListener>();
  listeners.add(listener);
  profileListeners.set(uid, listeners);

  const cached = profileCache.get(uid);
  if (cached) {
    listener(cached);
  }

  return () => {
    const current = profileListeners.get(uid);

    if (!current) {
      return;
    }

    current.delete(listener);

    if (current.size === 0) {
      profileListeners.delete(uid);
    }
  };
}

export function mergeCachedUserProfile(uid: string, patch: Partial<UserProfile>): UserProfile {
  const cached = profileCache.get(uid) ?? {};
  const merged = {
    ...cached,
    ...patch,
  } satisfies UserProfile;

  emitProfile(uid, merged);
  return merged;
}

function normalizeFirstEntryInput(firstEntryAt?: Date | Timestamp): FieldValue | Timestamp {
  if (!firstEntryAt) {
    return serverTimestamp();
  }

  if (firstEntryAt instanceof Timestamp) {
    return firstEntryAt;
  }

  return Timestamp.fromDate(firstEntryAt);
}

export async function ensureFirstEntryAt(
  uid: string,
  firstEntryAt?: Date | Timestamp,
): Promise<UserProfile> {
  const cached = await loadUserProfile(uid);

  if (getFirstEntryDate(cached)) {
    return cached;
  }

  const userRef = doc(firestore, "users", uid);
  const userSnap = await getDoc(userRef);
  const sourceProfile = normalizeProfile(userSnap.data()?.profile);

  if (getFirstEntryDate(sourceProfile)) {
    emitProfile(uid, sourceProfile);
    return sourceProfile;
  }

  const normalizedFirstEntry = normalizeFirstEntryInput(firstEntryAt);

  await setDoc(
    userRef,
    {
      profile: {
        firstEntryAt: normalizedFirstEntry,
      },
    },
    { merge: true },
  );

  const fallbackEntryDate =
    firstEntryAt instanceof Timestamp
      ? firstEntryAt
      : firstEntryAt ?? new Date();

  const updatedProfile = {
    ...sourceProfile,
    firstEntryAt: fallbackEntryDate,
  } satisfies UserProfile;

  emitProfile(uid, updatedProfile);

  return updatedProfile;
}
