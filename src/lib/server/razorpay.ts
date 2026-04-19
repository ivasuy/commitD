import crypto from "node:crypto";

import Razorpay from "razorpay";

const LIFETIME_AMOUNT_MAJOR = 20;
const TRIAL_DELAY_SECONDS = 24 * 60 * 60;

export type SubscriptionPlan = "weekly" | "monthly";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

function requiredEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getRazorpayPublicKey(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? requiredEnv("RAZORPAY_KEY_ID");
}

function getRazorpaySecret(): string {
  return requiredEnv("RAZORPAY_KEY_SECRET");
}

function getRazorpayCurrency(): string {
  return (process.env.RAZORPAY_CURRENCY ?? "USD").toUpperCase();
}

function toSmallestUnit(amountMajor: number, currency: string): number {
  const multiplier = ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100;
  return Math.round(amountMajor * multiplier);
}

function razorpayClient(): Razorpay {
  return new Razorpay({
    key_id: requiredEnv("RAZORPAY_KEY_ID"),
    key_secret: getRazorpaySecret(),
  });
}

function planLabel(plan: SubscriptionPlan): string {
  return plan === "monthly" ? "Monthly" : "Weekly";
}

function planEnvKey(plan: SubscriptionPlan): "RAZORPAY_PLAN_ID_WEEKLY" | "RAZORPAY_PLAN_ID_MONTHLY" {
  return plan === "monthly" ? "RAZORPAY_PLAN_ID_MONTHLY" : "RAZORPAY_PLAN_ID_WEEKLY";
}

function getPlanId(plan: SubscriptionPlan): string {
  const key = planEnvKey(plan);
  const value = process.env[key]?.trim();

  if (!value || value.includes("__REPLACE_WITH_REAL_PLAN_ID__")) {
    throw new Error(`${planLabel(plan)} plan is not configured yet.`);
  }

  return value;
}

export async function createLifetimeOrder(uid: string): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  const client = razorpayClient();
  const currency = getRazorpayCurrency();

  const order = await client.orders.create({
    amount: toSmallestUnit(LIFETIME_AMOUNT_MAJOR, currency),
    currency,
    receipt: `lockin_${uid.slice(0, 12)}_${Date.now()}`,
    notes: {
      uid,
      plan: "lifetime",
    },
  });

  const normalizedAmount =
    typeof order.amount === "string" ? Number(order.amount) : order.amount;

  return {
    orderId: order.id,
    amount: normalizedAmount,
    currency: order.currency,
    keyId: getRazorpayPublicKey(),
  };
}

export function verifyLifetimeSignature(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const payload = `${input.razorpay_order_id}|${input.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpaySecret())
    .update(payload)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(input.razorpay_signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function createSubscription(uid: string, plan: SubscriptionPlan): Promise<{
  subscriptionId: string;
  keyId: string;
  plan: SubscriptionPlan;
  description: string;
}> {
  const client = razorpayClient();
  const planId = getPlanId(plan);
  const totalCount = plan === "monthly" ? 120 : 520;

  const subscription = await client.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    customer_notify: 1,
    start_at: Math.floor(Date.now() / 1000) + TRIAL_DELAY_SECONDS,
    notes: {
      uid,
      plan,
    },
  });

  return {
    subscriptionId: subscription.id,
    keyId: getRazorpayPublicKey(),
    plan,
    description: `${planLabel(plan)} plan`,
  };
}

export function verifySubscriptionSignature(input: {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const payload = `${input.razorpay_payment_id}|${input.razorpay_subscription_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpaySecret())
    .update(payload)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(input.razorpay_signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function fetchSubscription(subscriptionId: string) {
  const client = razorpayClient();
  return client.subscriptions.fetch(subscriptionId);
}

export async function cancelSubscriptionAtCycleEnd(subscriptionId: string) {
  const client = razorpayClient();
  return client.subscriptions.cancel(subscriptionId, true);
}

export function resolvePlanFromPlanId(planId: string | undefined | null): SubscriptionPlan | null {
  if (!planId) {
    return null;
  }

  const weekly = process.env.RAZORPAY_PLAN_ID_WEEKLY?.trim();
  const monthly = process.env.RAZORPAY_PLAN_ID_MONTHLY?.trim();

  if (monthly && !monthly.includes("__REPLACE_WITH_REAL_PLAN_ID__") && planId === monthly) {
    return "monthly";
  }

  if (weekly && !weekly.includes("__REPLACE_WITH_REAL_PLAN_ID__") && planId === weekly) {
    return "weekly";
  }

  return null;
}
