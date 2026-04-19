import type React from "react";
import Link from "next/link";
import { ArrowRight, Check, type LucideIcon, PlusIcon } from "lucide-react";

import DotPattern from "@/src/components/ui/dot-pattern";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { cn } from "@/src/lib/cn";

type ContactInfoProps = React.ComponentProps<"div"> & {
  icon: LucideIcon;
  label: string;
  value: string;
};

type LandingContactCardProps = React.ComponentProps<"div"> & {
  title?: string;
  description?: string;
  contactInfo?: ContactInfoProps[];
  formSectionClassName?: string;
};

export function LandingContactCard({
  title = "Pricing",
  description = "Pick a plan and start using CommitD.",
  contactInfo: _contactInfo,
  className,
  formSectionClassName,
  children: _children,
  ...props
}: LandingContactCardProps) {
  void _contactInfo;
  void _children;

  return (
    <div
      className={cn(
        "relative grid h-full w-full rounded-lg border-2 border-white/10 bg-white/5 shadow-lg backdrop-blur-sm md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    >
      <DotPattern width={5} height={5} />
      <PlusIcon className="absolute -left-3 -top-3 h-6 w-6 text-white [text-shadow:0_2px_8px_rgb(0_0_0/60%)]" />
      <PlusIcon className="absolute -right-3 -top-3 h-6 w-6 text-white [text-shadow:0_2px_8px_rgb(0_0_0/60%)]" />
      <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-white [text-shadow:0_2px_8px_rgb(0_0_0/60%)]" />
      <PlusIcon className="absolute -bottom-3 -right-3 h-6 w-6 text-white [text-shadow:0_2px_8px_rgb(0_0_0/60%)]" />
      <div className="flex flex-col justify-between lg:col-span-2">
        <div className="relative h-full space-y-4 px-4 py-8 md:p-8">
          <h1 className="text-3xl font-bold text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] md:text-4xl lg:text-5xl font-open-sans-custom">
            {title}
          </h1>
          <p className="max-w-xl text-sm text-gray-300 [text-shadow:0_2px_10px_rgb(0_0_0/50%)] md:text-base lg:text-lg font-open-sans-custom">
            {description}
          </p>

          <div className="overflow-hidden rounded-xl border border-white/15 bg-black/30 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <table className="w-full text-left text-xs text-gray-200 md:text-sm">
              <thead className="bg-white/12 text-[10px] uppercase tracking-[0.24em] text-white/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">Option</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Features</th>
                </tr>
              </thead>
              <tbody className="[&>tr:not(:last-child)]:border-b [&>tr:not(:last-child)]:border-white/10 [&>tr]:transition-colors [&>tr]:duration-200 [&>tr:hover]:bg-white/4">
                <tr className="align-top">
                  <td className="px-4 py-3 font-medium text-white">Unlock forever</td>
                  <td className="px-4 py-3 font-semibold">$20 one-time</td>
                  <td className="px-4 py-3 text-gray-300">
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Unlimited access to all trackers</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>No renewals (one-time purchase)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Full dashboard insights</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Priority support / early features</span>
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-4 py-3 font-medium text-white">Monthly</td>
                  <td className="px-4 py-3 font-semibold">$5.99/mo</td>
                  <td className="px-4 py-3 text-gray-300">
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Full access to all trackers</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Monthly renewal</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Dashboard insights</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Cancel anytime</span>
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-4 py-3 font-medium text-white">Weekly</td>
                  <td className="px-4 py-3 font-semibold">$2.99/week</td>
                  <td className="px-4 py-3 text-gray-300">
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Full access to all trackers</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Weekly renewal</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Great for short sprints</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Cancel anytime</span>
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-4 py-3 font-medium text-white">Free trial</td>
                  <td className="px-4 py-3 font-semibold">1 day</td>
                  <td className="px-4 py-3 text-gray-300">
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Full access for 1 day</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>No plan needed to start</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Data stays safe after trial</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/85" aria-hidden />
                        <span>Upgrade anytime</span>
                      </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex h-full w-full items-center border-t border-white/10 bg-white/10 p-5 md:col-span-1 md:border-l md:border-t-0",
          formSectionClassName,
        )}
      >
        <div className="w-full space-y-4">
          <p className="text-sm text-gray-200 font-open-sans-custom">
            1-day free trial is available inside the app after sign-in.
          </p>
          <Link href="/signin" className="block">
            <ShinyButton className="w-full scale-100 px-5 py-3 normal-case tracking-widest font-open-sans-custom">
              <span className="inline-flex items-center gap-2">
                Start now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </ShinyButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
