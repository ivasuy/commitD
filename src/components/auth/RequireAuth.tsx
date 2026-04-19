"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

import PaywallPanel from "@/src/components/paywall/PaywallPanel";
import { PaywallProvider } from "@/src/components/paywall/PaywallContext";
import GlassModal from "@/src/components/ui/GlassModal";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import type { UserProfile } from "@/src/lib/db/profile";
import { mergeCachedUserProfile } from "@/src/lib/db/profile";
import {
  hasAccess,
  normalizePlan,
  shouldStartTrial,
  type EntitlementProfileFields,
} from "@/src/lib/entitlement";

interface TrialStartResponse {
  success: boolean;
  profileEntitlement?: Partial<UserProfile> | null;
  message?: string;
}

async function postAuthed<TResponse>(
  user: User,
  url: string,
  body: unknown,
): Promise<TResponse> {
  const token = await user.getIdToken();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & TResponse;

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
}

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user);
  const router = useRouter();
  const pathname = usePathname();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const attemptedTrialForUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || user) {
      return;
    }

    const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
    router.replace(`/signin${redirect}`);
  }, [loading, user, router, pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    attemptedTrialForUidRef.current = null;
  }, [user?.uid]);

  useEffect(() => {
    if (!user || profileLoading) {
      return;
    }

    if (attemptedTrialForUidRef.current === user.uid) {
      return;
    }

    attemptedTrialForUidRef.current = user.uid;

    if (!shouldStartTrial(profile as EntitlementProfileFields | null)) {
      return;
    }

    let canceled = false;

    void postAuthed<TrialStartResponse>(user, "/api/trial/start", {})
      .then((response) => {
        if (canceled || !response.success || !response.profileEntitlement) {
          return;
        }

        mergeCachedUserProfile(user.uid, response.profileEntitlement);
      })
      .catch(() => {
        // Trial bootstrap failure should not block app rendering.
      });

    return () => {
      canceled = true;
    };
  }, [user, profile, profileLoading]);

  const entitled = useMemo(
    () => hasAccess(profile as EntitlementProfileFields | null, now),
    [profile, now],
  );
  const trialSetupNeeded = useMemo(
    () => shouldStartTrial(profile as EntitlementProfileFields | null),
    [profile],
  );
  const canOpenUpgrade = useMemo(
    () => normalizePlan(profile?.plan) !== "lifetime",
    [profile],
  );
  const shouldShowBlockingPaywall = !entitled && !trialSetupNeeded;

  const updateEntitlement = useCallback(
    (patch: Partial<UserProfile>) => {
      if (!user) {
        return;
      }

      mergeCachedUserProfile(user.uid, patch);

      const isActivatedSubscription =
        (patch.plan === "weekly" || patch.plan === "monthly") &&
        patch.planStatus === "active";

      if (patch.plan === "lifetime" || isActivatedSubscription) {
        setUpgradeOpen(false);
      }
    },
    [user],
  );

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a]">
        <div className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm text-white/70 backdrop-blur-sm">
          Keeping you CommitD...
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a]">
        <div className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm text-white/70 backdrop-blur-sm">
          Always CommitD...
        </div>
      </div>
    );
  }

  return (
    <PaywallProvider
      value={{
        openUpgrade: () => {
          if (!canOpenUpgrade) {
            return;
          }

          setUpgradeOpen(true);
        },
        canOpenUpgrade,
      }}
    >
      <div className="relative min-h-screen">
        <div className={shouldShowBlockingPaywall ? "pointer-events-none select-none blur-sm" : ""}>
          {children}
        </div>

        {shouldShowBlockingPaywall ? (
          <div className="fixed inset-0 z-1200 flex items-center justify-center overflow-y-auto bg-black/65 px-4 py-8 backdrop-blur-sm">
            <div className="my-auto w-full max-w-5xl rounded-2xl border border-white/15 bg-black/55 p-4 shadow-2xl backdrop-blur-xl md:p-7">
              <h2 className="mb-4 text-xl font-semibold text-white sm:text-2xl">
                Choose a plan to continue
              </h2>
              <PaywallPanel
                user={user}
                profile={profile}
                blocked
                onEntitlementUpdate={updateEntitlement}
              />
            </div>
          </div>
        ) : null}

        <GlassModal
          open={canOpenUpgrade && upgradeOpen && (entitled || trialSetupNeeded)}
          onClose={() => setUpgradeOpen(false)}
          title="Plan"
          className="max-w-4xl"
        >
          <PaywallPanel
            user={user}
            profile={profile}
            blocked={false}
            onEntitlementUpdate={updateEntitlement}
          />
        </GlassModal>
      </div>
    </PaywallProvider>
  );
}
