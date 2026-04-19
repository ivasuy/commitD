"use client";

import { Check } from "lucide-react";

import DotPattern from "@/src/components/ui/dot-pattern";
import { LandingBadge } from "@/src/components/ui/landing/LandingBadge";
import { LandingButton } from "@/src/components/ui/landing/LandingButton";
import { cn } from "@/src/lib/cn";

type PricingCardProps = {
  titleBadge: string;
  priceLabel: string;
  priceSuffix?: string;
  features: string[];
  cta?: string;
  className?: string;
};

function LandingPricingCard({
  titleBadge,
  priceLabel,
  priceSuffix = "",
  features,
  cta = "Done",
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border-2 border-white/10 bg-white/5 backdrop-blur-sm",
        className,
      )}
    >
      <DotPattern width={5} height={5} />
      <div className="flex items-center gap-3 p-3">
        <LandingBadge
          variant="secondary"
          className="border-white/20 bg-white/10 text-xs text-white font-open-sans-custom"
        >
          {titleBadge}
        </LandingBadge>
        <div className="ml-auto">
          <LandingButton
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 font-open-sans-custom"
          >
            {cta}
          </LandingButton>
        </div>
      </div>

      <div className="flex items-end gap-2 px-3 py-1">
        <span className="font-mono text-2xl font-semibold tracking-tight text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] lg:text-3xl">
          {priceLabel}
        </span>
        {priceSuffix ? <span className="text-xs text-gray-300 font-open-sans-custom">{priceSuffix}</span> : null}
      </div>

      <ul className="grid gap-2 p-3 text-xs text-gray-300 font-open-sans-custom">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-[1.05rem] w-[1.05rem] shrink-0 text-white" strokeWidth={3} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingBentoPricing() {
  return (
    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 lg:grid-cols-8">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md border-2 border-white/10 bg-white/5 backdrop-blur-sm",
          "lg:col-span-5",
        )}
      >
        <DotPattern width={5} height={5} />
        <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full mask-[linear-gradient(white,transparent)]">
          <div className="absolute inset-0 bg-linear-to-r from-white/5 to-white/2 mask-[radial-gradient(farthest-side_at_top,white,transparent)]">
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 size-full mix-blend-overlay",
                "bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px)]",
                "bg-size-[24px]",
              )}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3">
          <LandingBadge
            variant="secondary"
            className="border-white/20 bg-white/10 text-xs text-white font-open-sans-custom"
          >
            STEP 1
          </LandingBadge>
          <div className="ml-auto">
            <LandingButton size="sm" className="bg-white text-xs text-black hover:bg-gray-100 font-open-sans-custom">
              Setup
            </LandingButton>
          </div>
        </div>
        <div className="flex flex-col p-3 lg:flex-row">
          <div className="pb-2 lg:w-[36%]">
            <span className="font-mono text-2xl font-semibold tracking-tight text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] lg:text-3xl">
              Set it up once.
            </span>
          </div>
          <ul className="grid gap-2 text-xs text-gray-300 lg:w-[64%] font-open-sans-custom">
            {[
              "Add habits, categories, and finance sources.",
              "Define weekly priorities and recurring essentials.",
              "Build a clean baseline before the week begins.",
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-[1.05rem] w-[1.05rem] shrink-0 text-white" strokeWidth={3} />
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <LandingPricingCard
        titleBadge="STEP 2"
        priceLabel="Log daily in seconds."
        features={[
          "Update tasks, mood, and spending as you go.",
          "Keep progress visible without extra overhead.",
          "Maintain momentum with minimal friction.",
        ]}
        className="lg:col-span-3"
        cta="Log"
      />

      <LandingPricingCard
        titleBadge="STEP 3"
        priceLabel="Review weekly. Improve monthly."
        features={[
          "Use snapshots to spot what is working.",
          "Catch weak points before they compound.",
          "Adjust your system and execute again.",
        ]}
        className="lg:col-span-4"
        cta="Review"
      />

      <LandingPricingCard
        titleBadge="WEEKLY"
        priceLabel="Plan. Execute. Repeat."
        features={[
          "Weekly Planner: plan the week and execute day by day.",
          "Habit Tracker: mood + motivation in context.",
          "Task Tracker: priorities, status, categories—kept simple.",
        ]}
        className="lg:col-span-4"
        cta="Flow"
      />

      <LandingPricingCard
        titleBadge="DASHBOARD"
        priceLabel="Everything, summarized clearly."
        features={[
          "Unified view across weekly plans, habits, tasks, and finance.",
          "Quick trend checks to guide your next actions.",
          "Built for focus. Designed for consistency.",
        ]}
        className="lg:col-span-8"
        cta="Track"
      />
    </div>
  );
}
