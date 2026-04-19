"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { Check, Crown } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import type { UserProfile } from "@/src/lib/db/profile";
import { cn } from "@/src/lib/cn";
import {
  getTrialHoursRemaining,
  normalizePlan,
  normalizePlanStatus,
  parseDateLike,
  type EntitlementProfileFields,
} from "@/src/lib/entitlement";

interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpaySubscriptionResponse {
  subscription_id: string;
  key_id: string;
  plan: "monthly" | "weekly";
  name?: string;
  description?: string;
}

interface EntitlementResponse {
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  plan: "none" | "weekly" | "monthly" | "lifetime";
  planStatus: "active" | "expired" | "canceled" | null;
  currentPeriodEnd: string | null;
  razorpaySubscriptionId: string | null;
  razorpayPaymentId: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  updatedAt: string | null;
}

interface VerifyResponse {
  success: boolean;
  profile: EntitlementResponse;
}

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: {
    email?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
}

interface RazorpayCheckoutError {
  error?: {
    description?: string;
  };
}

interface RazorpayCheckoutInstance {
  open: () => void;
  on: (eventName: "payment.failed", callback: (payload: RazorpayCheckoutError) => void) => void;
}

type RazorpayCheckoutConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCheckoutConstructor;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

async function ensureRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Razorpay is unavailable in this environment.");
  }

  if (window.Razorpay) {
    return;
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.body.appendChild(script);
  }).catch((error) => {
    razorpayScriptPromise = null;
    throw error;
  });

  return razorpayScriptPromise;
}

async function authedPost<TResponse>(user: User, url: string, body: unknown): Promise<TResponse> {
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

function formatDateLabel(value: unknown): string | null {
  const date = parseDateLike(value);

  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

interface PlanCardProps {
  planKey: "lifetime" | "monthly" | "weekly";
  title: string;
  price: string;
  features: string[];
  buttonLabel: string;
  selected: boolean;
  badge?: string;
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

function PlanCard({
  planKey,
  title,
  price,
  features,
  buttonLabel,
  selected,
  badge,
  disabled,
  active,
  loading,
  onSelect,
  onClick,
}: PlanCardProps) {
  const canClick = !disabled && !loading;

  return (
    <article
      className={cn(
        "relative rounded-xl border p-4 text-white transition-all duration-200 hover:scale-[1.01]",
        selected
          ? "border-emerald-200/80 bg-white/9 shadow-[0_0_0_1px_rgba(167,243,208,0.6),0_0_26px_rgba(16,185,129,0.35),0_22px_50px_rgba(16,185,129,0.24)]"
          : "border-white/15 bg-white/5 shadow-[0_10px_28px_rgba(0,0,0,0.26)]",
      )}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
    >
      {badge && selected ? (
        <span className="absolute right-3 top-3 rounded-full border border-emerald-200/60 bg-emerald-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
          {badge}
        </span>
      ) : null}

      <div className="space-y-1">
        <p className={cn("text-xs uppercase tracking-[0.2em]", selected ? "text-white/80" : "text-white/60")}>
          {title}
        </p>
        <p className="text-2xl font-semibold text-white">{price}</p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-1.5 text-xs text-white/75">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-white/65">
        {active ? "Current plan" : "Secure checkout via Razorpay"}
      </p>

      <div className="mt-4">
        {selected ? (
          <ShinyButton
            className="w-full scale-100 px-4 py-2.5 text-[12px] tracking-[0.12em]"
            onClick={(event) => {
              event.stopPropagation();
              if (canClick) {
                onClick?.();
              }
            }}
            disabled={disabled || loading}
            aria-label={`${planKey} action`}
          >
            <span className="inline-flex items-center gap-2">
              <Crown className="h-4 w-4" aria-hidden />
              {active ? "Active" : loading ? "Processing..." : buttonLabel}
            </span>
          </ShinyButton>
        ) : (
          <Button
            className="w-full"
            variant="glass-outline"
            onClick={(event) => {
              event.stopPropagation();
              onClick?.();
            }}
            disabled={disabled || loading}
          >
            {active ? "Active" : loading ? "Processing..." : buttonLabel}
          </Button>
        )}
      </div>
    </article>
  );
}

interface PaywallPanelProps {
  user: User;
  profile: UserProfile | null;
  blocked: boolean;
  onEntitlementUpdate: (patch: Partial<UserProfile>) => void;
}

export default function PaywallPanel({
  user,
  profile,
  blocked,
  onEntitlementUpdate,
}: PaywallPanelProps) {
  const isOpeningSubscriptionCheckoutRef = useRef(false);
  const [selectedPlan, setSelectedPlan] = useState<"lifetime" | "monthly" | "weekly">("lifetime");
  const [now, setNow] = useState(() => new Date());
  const [busyPlan, setBusyPlan] = useState<"lifetime" | "monthly" | "weekly" | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const plan = normalizePlan(profile?.plan);
  const planStatus = normalizePlanStatus(profile?.planStatus);
  const currentPeriodEndDate = parseDateLike(profile?.currentPeriodEnd);
  const currentPeriodEndLabel = formatDateLabel(profile?.currentPeriodEnd);
  const hasFuturePeriodEnd = Boolean(
    currentPeriodEndDate && currentPeriodEndDate.getTime() >= now.getTime(),
  );
  const isRecurringPlan = plan === "weekly" || plan === "monthly";
  const isCancellationScheduled = profile?.cancelAtPeriodEnd === true || planStatus === "canceled";
  const canCancelSubscription = Boolean(
    isRecurringPlan &&
      planStatus === "active" &&
      typeof profile?.razorpaySubscriptionId === "string" &&
      !isCancellationScheduled,
  );
  const shouldShowCancellationEndState = Boolean(
    isRecurringPlan &&
      isCancellationScheduled &&
      hasFuturePeriodEnd,
  );
  const trialHoursRemaining = getTrialHoursRemaining(profile as EntitlementProfileFields, now);
  const isTrialActive =
    trialHoursRemaining !== null &&
    trialHoursRemaining > 0;
  const trialHoursLabel = trialHoursRemaining === 1 ? "hour" : "hours";

  const currentPlanLabel = useMemo(() => {
    if (plan === "none") {
      return "No paid plan";
    }

    if (plan === "lifetime") {
      return "Lifetime";
    }

    return plan === "monthly" ? "Monthly" : "Weekly";
  }, [plan]);

  const applyEntitlement = (verification: VerifyResponse) => {
    if (!verification.profile) {
      return;
    }

    const entitlementPatch: Partial<UserProfile> = {
      trialStartedAt: verification.profile.trialStartedAt,
      trialEndsAt: verification.profile.trialEndsAt,
      plan: verification.profile.plan,
      planStatus: verification.profile.planStatus ?? undefined,
      currentPeriodEnd: verification.profile.currentPeriodEnd,
      razorpaySubscriptionId: verification.profile.razorpaySubscriptionId,
      razorpayPaymentId: verification.profile.razorpayPaymentId,
      cancelAtPeriodEnd: verification.profile.cancelAtPeriodEnd,
      canceledAt: verification.profile.canceledAt,
      updatedAt: verification.profile.updatedAt,
    };

    onEntitlementUpdate(entitlementPatch);
  };

  const cancelSubscription = async () => {
    if (!canCancelSubscription || cancelBusy) {
      return;
    }

    const endDateForPrompt = currentPeriodEndLabel ?? "your current billing period end";
    const confirmed = window.confirm(
      `You'll keep access until ${endDateForPrompt}. You won't be charged again.`,
    );

    if (!confirmed) {
      return;
    }

    setCancelBusy(true);
    setInfo(null);
    setMessage(null);
    setError(null);

    try {
      const cancellation = await authedPost<VerifyResponse>(
        user,
        "/api/razorpay/subscription/cancel",
        {},
      );

      applyEntitlement(cancellation);

      const endDateLabel =
        formatDateLabel(cancellation.profile.currentPeriodEnd) ?? endDateForPrompt;
      setMessage(`Subscription will end on ${endDateLabel}.`);
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Could not cancel subscription.",
      );
    } finally {
      setCancelBusy(false);
    }
  };

  const openLifetimeCheckout = async () => {
    setBusyPlan("lifetime");
    setInfo(null);
    setMessage(null);
    setError(null);

    try {
      await ensureRazorpayScript();

      const order = await authedPost<RazorpayOrderResponse>(user, "/api/razorpay/order", {
        plan: "lifetime",
      });

      const verification = await new Promise<VerifyResponse | null>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Razorpay checkout is unavailable."));
          return;
        }

        let settled = false;

        const settleResolve = (value: VerifyResponse | null) => {
          if (settled) {
            return;
          }

          settled = true;
          resolve(value);
        };

        const settleReject = (reason: Error) => {
          if (settled) {
            return;
          }

          settled = true;
          reject(reason);
        };

        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "CommitD",
          description: "Lifetime access",
          order_id: order.orderId,
          prefill: {
            email: user.email ?? undefined,
          },
          theme: {
            color: "#34d399",
          },
          modal: {
            ondismiss: () => {
              settleResolve(null);
            },
          },
          handler: async (response) => {
            try {
              const verify = await authedPost<VerifyResponse>(user, "/api/razorpay/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              settleResolve(verify);
            } catch (verificationError) {
              settleReject(
                verificationError instanceof Error
                  ? verificationError
                  : new Error("Could not verify payment."),
              );
            }
          },
        });

        checkout.on("payment.failed", (payload) => {
          settleReject(new Error(payload.error?.description ?? "Payment failed."));
        });

        checkout.open();
      });

      if (verification?.profile) {
        applyEntitlement(verification);
        setMessage("Lifetime unlocked.");
      }
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed.");
    } finally {
      setBusyPlan(null);
    }
  };

  const openSubscriptionCheckout = async (planKey: "monthly" | "weekly") => {
    if (isOpeningSubscriptionCheckoutRef.current || busyPlan !== null) {
      return;
    }

    isOpeningSubscriptionCheckoutRef.current = true;
    setBusyPlan(planKey);
    setMessage(null);
    setError(null);
    setInfo(null);

    try {
      await ensureRazorpayScript();

      const subscription = await authedPost<RazorpaySubscriptionResponse>(
        user,
        "/api/razorpay/subscription",
        {
          plan: planKey,
        },
      );
      const resolvedPlan = subscription.plan;
      const razorpayPublicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? subscription.key_id;
      const cancellationMessage = "Payment cancelled. No charge made.";

      const verification = await new Promise<VerifyResponse | null>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Razorpay checkout is unavailable."));
          return;
        }

        let settled = false;

        const settleResolve = (value: VerifyResponse | null) => {
          if (settled) {
            return;
          }

          settled = true;
          resolve(value);
        };

        const settleReject = (reason: Error) => {
          if (settled) {
            return;
          }

          settled = true;
          reject(reason);
        };

        const checkout = new window.Razorpay({
          key: razorpayPublicKey,
          name: subscription.name ?? "CommitD",
          description:
            subscription.description ??
            (resolvedPlan === "monthly" ? "Monthly plan" : "Weekly plan"),
          subscription_id: subscription.subscription_id,
          prefill: {
            email: user.email ?? undefined,
          },
          theme: {
            color: "#34d399",
          },
          modal: {
            ondismiss: () => {
              settleResolve(null);
            },
          },
          handler: async (response) => {
            try {
              const verify = await authedPost<VerifyResponse>(
                user,
                "/api/razorpay/verify-subscription",
                {
                  plan: resolvedPlan,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                },
              );

              settleResolve(verify);
            } catch (verificationError) {
              settleReject(
                verificationError instanceof Error
                  ? verificationError
                  : new Error("Could not verify subscription."),
              );
            }
          },
        });

        checkout.on("payment.failed", () => {
          settleResolve(null);
        });

        checkout.open();
      });

      if (verification?.profile) {
        applyEntitlement(verification);
        const label = planKey === "monthly" ? "Monthly" : "Weekly";
        setMessage(`${label} plan activated.`);
      } else {
        setInfo(cancellationMessage);
      }
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Subscription checkout failed.";

      if (message.toLowerCase().includes("not configured")) {
        console.error(message);
        setInfo(message);
      } else {
        setError(message);
      }
    } finally {
      isOpeningSubscriptionCheckoutRef.current = false;
      setBusyPlan(null);
    }
  };

  return (
    <div className="max-h-[85vh] space-y-5 overflow-y-auto text-white scrollbar-thin-dark md:max-h-none md:overflow-y-visible">
      <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Access</p>
        <p className="mt-1 text-xs text-white/60">Current plan: {currentPlanLabel}</p>
        {!blocked && isTrialActive && trialHoursRemaining !== null ? (
          <p className="mt-1 text-sm text-white/85">
            Trial ends in {trialHoursRemaining} {trialHoursLabel}.
          </p>
        ) : null}
        {blocked ? (
          <div className="mt-2 space-y-1 text-xs text-white/75">
            <p>Your data is safe.</p>
            <p>Unlock to restore full interaction.</p>
          </div>
        ) : null}
        <div className="mt-2 space-y-1 text-xs text-white/75">
          <p>Your data stays safe even if your trial ends.</p>
          <p>Upgrade anytime.</p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <PlanCard
          planKey="lifetime"
          title="Unlock forever"
          price="$20 one-time"
          features={[
            "Unlimited access to all trackers",
            "Includes all future upgrades.",
            "No renewals",
            "Full dashboard insights",
            "Priority support + early features",
          ]}
          buttonLabel="Unlock forever"
          badge="Best value"
          selected={selectedPlan === "lifetime"}
          active={plan === "lifetime"}
          disabled={plan === "lifetime"}
          loading={busyPlan === "lifetime"}
          onSelect={() => setSelectedPlan("lifetime")}
          onClick={openLifetimeCheckout}
        />

        <PlanCard
          planKey="monthly"
          title="Monthly"
          price="$5.99/mo"
          features={[
            "Full access to all trackers",
            "Renews monthly",
            "Best for consistent tracking",
            "Cancel anytime",
          ]}
          buttonLabel="Choose monthly"
          selected={selectedPlan === "monthly"}
          active={plan === "monthly"}
          disabled={plan === "monthly"}
          loading={busyPlan === "monthly"}
          onSelect={() => setSelectedPlan("monthly")}
          onClick={() => openSubscriptionCheckout("monthly")}
        />

        <PlanCard
          planKey="weekly"
          title="Weekly"
          price="$2.99/week"
          features={[
            "Full access to all trackers",
            "Renews weekly",
            "Great for short sprints",
            "Cancel anytime",
          ]}
          buttonLabel="Choose weekly"
          selected={selectedPlan === "weekly"}
          active={plan === "weekly"}
          disabled={plan === "weekly"}
          loading={busyPlan === "weekly"}
          onSelect={() => setSelectedPlan("weekly")}
          onClick={() => openSubscriptionCheckout("weekly")}
        />
      </div>

      <p className="text-xs text-white/65">Free trial: 1 day</p>

      {canCancelSubscription ? (
        <div className="space-y-3 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3">
          <p className="text-xs text-rose-100/90">
            Auto-renewal is on. Cancel now to keep access until {currentPeriodEndLabel ?? "period end"}.
          </p>
          <Button
            className="w-full rounded-lg border border-rose-200/55 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-65"
            onClick={cancelSubscription}
            disabled={cancelBusy}
          >
            {cancelBusy ? "Cancelling..." : "Cancel subscription"}
          </Button>
        </div>
      ) : null}

      {shouldShowCancellationEndState ? (
        <div className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Ends on {currentPeriodEndLabel ?? "the period end date"} (canceled)
        </div>
      ) : null}

      {info ? (
        <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white/90">
          {info}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-300/35 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
