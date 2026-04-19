import { Check } from "lucide-react";

import { LandingBadge } from "@/src/components/ui/landing/LandingBadge";

export function LandingFeatureWithAdvantages() {
  return (
    <div className="w-full py-20 lg:py-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start gap-4 py-20 lg:py-0">
          <div>
            <LandingBadge className="border-white/20 bg-white/10 text-white backdrop-blur-sm">Platform</LandingBadge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl tracking-tighter text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] md:text-5xl lg:max-w-xl font-open-sans-custom">
              CommitD Core Tools
            </h2>
            <p className="max-w-xl text-lg leading-relaxed tracking-tight text-gray-300 [text-shadow:0_2px_10px_rgb(0_0_0/50%)] lg:max-w-xl font-open-sans-custom">
              Weekly planning, habits, tasks, finance, and a dashboard that keeps everything visible.
            </p>
          </div>
          <div className="flex w-full flex-col gap-10 pt-12">
            <div className="grid grid-cols-2 items-start gap-10 lg:grid-cols-3">
              <div className="flex w-full flex-row items-start gap-6">
                <Check className="mt-2 h-[1.05rem] w-[1.05rem] text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-open-sans-custom">Weekly Planner</p>
                  <p className="text-sm text-gray-300 font-open-sans-custom">Plan the week. Execute day by day.</p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-6">
                <Check className="mt-2 h-[1.05rem] w-[1.05rem] text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-open-sans-custom">Habit Tracker</p>
                  <p className="text-sm text-gray-300 font-open-sans-custom">Track habits with mood + motivation.</p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-6">
                <Check className="mt-2 h-[1.05rem] w-[1.05rem] text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-open-sans-custom">Task Tracker</p>
                  <p className="text-sm text-gray-300 font-open-sans-custom">
                    Priorities, status, categories—kept simple.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-row items-start gap-6">
                <Check className="mt-2 h-[1.05rem] w-[1.05rem] text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-open-sans-custom">Finance Tracker</p>
                  <p className="text-sm text-gray-300 font-open-sans-custom">
                    Recurring money + daily spending, minus the chaos.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-6">
                <Check className="mt-2 h-[1.05rem] w-[1.05rem] text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-open-sans-custom">Dashboard</p>
                  <p className="text-sm text-gray-300 font-open-sans-custom">
                    Everything you do, summarized clearly.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-6">
                <Check className="mt-2 h-[1.05rem] w-[1.05rem] text-white" strokeWidth={3} />
                <div className="flex flex-col gap-1">
                  <p className="text-white font-open-sans-custom">Consistency Loop</p>
                  <p className="text-sm text-gray-300 font-open-sans-custom">
                    Built for focus. Designed for consistency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
