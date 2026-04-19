"use client";

import DotPattern from "@/src/components/ui/dot-pattern";

export function LandingAboutQuote() {
  return (
    <div className="mx-auto mb-10 max-w-7xl px-6 md:mb-20 xl:px-0">
      <div className="relative flex flex-col items-center rounded-lg border-2 border-white/20 bg-white/5 backdrop-blur-sm">
        <DotPattern width={5} height={5} />

        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white/80" />

        <div className="relative z-20 mx-auto max-w-5xl rounded-[40px] py-6 md:p-10 xl:py-20">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] md:mb-8 md:text-5xl lg:text-6xl xl:text-7xl font-open-sans-custom">
            Built for focus. Designed for consistency.
          </h1>
          <div className="space-y-4 md:space-y-6">
            <p className="text-base leading-relaxed text-white/90 [text-shadow:0_2px_10px_rgb(0_0_0/50%)] md:text-xl lg:text-2xl xl:text-3xl font-open-sans-custom">
              CommitD gives you one place to align weekly plans, habits, tasks, and finances without juggling separate
              tools.
            </p>
            <p className="text-base leading-relaxed text-white/90 [text-shadow:0_2px_10px_rgb(0_0_0/50%)] md:text-xl lg:text-2xl xl:text-3xl font-open-sans-custom">
              The result is simple: clearer execution today, and steadier progress over weeks and months.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
