"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";

import {
  getFirstEntryDate,
  getFirstEntryYmd,
  hasFirstEntry,
} from "@/src/lib/date/firstEntryWindow";
import {
  loadUserProfile,
  subscribeUserProfile,
  type UserProfile,
} from "@/src/lib/db/profile";

function parseAuthCreationDate(user: User | null): Date | null {
  const createdAt = user?.metadata.creationTime;

  if (!createdAt) {
    return null;
  }

  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function withCreatedAtFallback(profile: UserProfile, fallbackCreatedAt: Date): UserProfile {
  if (profile.createdAt !== undefined && profile.createdAt !== null) {
    return profile;
  }

  return {
    ...profile,
    createdAt: fallbackCreatedAt,
  };
}

export function useUserProfile(user: User | null): {
  profile: UserProfile | null;
  firstEntryDate: Date | null;
  firstEntryYmd: string | null;
  hasFirstEntry: boolean;
  loading: boolean;
} {
  const fallbackCreatedAt = useMemo(
    () => parseAuthCreationDate(user) ?? new Date(),
    [user],
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    let unsubscribe = () => {
      // noop
    };

    void Promise.resolve().then(async () => {
      if (!user) {
        if (ignore) {
          return;
        }

        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const applyProfile = (nextProfile: UserProfile) => {
        if (ignore) {
          return;
        }

        setProfile(withCreatedAtFallback(nextProfile, fallbackCreatedAt));
        setLoading(false);
      };

      unsubscribe = subscribeUserProfile(user.uid, applyProfile);

      try {
        const loadedProfile = await loadUserProfile(user.uid);
        applyProfile(loadedProfile);
      } catch {
        applyProfile({ createdAt: fallbackCreatedAt });
      }
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [user, fallbackCreatedAt]);

  const firstEntryDate = useMemo(() => getFirstEntryDate(profile), [profile]);
  const firstEntryDateYmd = useMemo(() => getFirstEntryYmd(profile), [profile]);
  const hasFirstEntryValue = useMemo(() => hasFirstEntry(profile), [profile]);

  return {
    profile,
    firstEntryDate,
    firstEntryYmd: firstEntryDateYmd,
    hasFirstEntry: hasFirstEntryValue,
    loading,
  };
}
