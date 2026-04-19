"use client";

import Image from "next/image";
import Link from "next/link";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import AppBackground from "@/src/components/shell/AppBackground";
import { LandingBentoPricing } from "@/src/components/ui/landing/LandingBentoPricing";
import { LandingButton } from "@/src/components/ui/landing/LandingButton";
import { LandingContactCard } from "@/src/components/ui/landing/LandingContactCard";
import { LandingFeatureWithAdvantages } from "@/src/components/ui/landing/LandingFeatureWithAdvantages";
import { LandingFloatingNavbar } from "@/src/components/ui/landing/LandingFloatingNavbar";
import { LandingInput } from "@/src/components/ui/landing/LandingInput";
import { LandingLabel } from "@/src/components/ui/landing/LandingLabel";
import { LandingShinyButton } from "@/src/components/ui/landing/LandingShinyButton";
import { LandingTextarea } from "@/src/components/ui/landing/LandingTextarea";
import { cn } from "@/src/lib/cn";

export default function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pricingSectionRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const scrollLockRef = useRef(false);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const SCROLL_DURATION_MS = 600;

    const handleWheel = (event: WheelEvent) => {
      if (scrollLockRef.current) {
        event.preventDefault();
        return;
      }
      const delta = event.deltaY;
      const currentScroll = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.offsetWidth;
      const currentSection = Math.round(currentScroll / containerWidth);

      if (currentSection === 2 && pricingSectionRef.current) {
        const pricingSection = pricingSectionRef.current;
        const isAtTop = pricingSection.scrollTop === 0;
        const isAtBottom =
          pricingSection.scrollTop + pricingSection.clientHeight >= pricingSection.scrollHeight - 1;

        if (delta > 0 && !isAtBottom) {
          event.preventDefault();
          pricingSection.scrollTop += delta;
          return;
        }

        if (delta < 0 && !isAtTop) {
          event.preventDefault();
          pricingSection.scrollTop += delta;
          return;
        }

        if (delta < 0 && isAtTop) {
          event.preventDefault();
          scrollLockRef.current = true;
          scrollContainer.scrollTo({
            left: 1 * containerWidth,
            behavior: "smooth",
          });
          setTimeout(() => { scrollLockRef.current = false; }, SCROLL_DURATION_MS);
          return;
        }

        if (delta > 0 && isAtBottom) {
          event.preventDefault();
          scrollLockRef.current = true;
          scrollContainer.scrollTo({
            left: 3 * containerWidth,
            behavior: "smooth",
          });
          setTimeout(() => { scrollLockRef.current = false; }, SCROLL_DURATION_MS);
          return;
        }
      }

      if (currentSection === 3 && aboutSectionRef.current) {
        const aboutSection = aboutSectionRef.current;
        const hasOverflow = aboutSection.scrollHeight > aboutSection.clientHeight;
        const isAtTop = aboutSection.scrollTop === 0;
        const isAtBottom =
          aboutSection.scrollTop + aboutSection.clientHeight >= aboutSection.scrollHeight - 1;

        if (hasOverflow) {
          if (delta > 0 && !isAtBottom) {
            event.preventDefault();
            aboutSection.scrollTop += delta;
            return;
          }

          if (delta < 0 && !isAtTop) {
            event.preventDefault();
            aboutSection.scrollTop += delta;
            return;
          }
        }

        if (delta < 0 && isAtTop) {
          event.preventDefault();
          scrollLockRef.current = true;
          scrollContainer.scrollTo({
            left: 2 * containerWidth,
            behavior: "smooth",
          });
          setTimeout(() => { scrollLockRef.current = false; }, SCROLL_DURATION_MS);
          return;
        }

        if (delta > 0 && isAtBottom) {
          event.preventDefault();
          scrollLockRef.current = true;
          scrollContainer.scrollTo({
            left: 4 * containerWidth,
            behavior: "smooth",
          });
          setTimeout(() => { scrollLockRef.current = false; }, SCROLL_DURATION_MS);
          return;
        }
      }

      if (currentSection === 4 && contactSectionRef.current) {
        const contactSection = contactSectionRef.current;
        const isAtTop = contactSection.scrollTop === 0;
        const isAtBottom =
          contactSection.scrollTop + contactSection.clientHeight >= contactSection.scrollHeight - 1;

        if (delta > 0 && !isAtBottom) {
          event.preventDefault();
          contactSection.scrollTop += delta;
          return;
        }

        if (delta < 0 && !isAtTop) {
          event.preventDefault();
          contactSection.scrollTop += delta;
          return;
        }

        if (delta < 0 && isAtTop) {
          event.preventDefault();
          scrollLockRef.current = true;
          scrollContainer.scrollTo({
            left: 3 * containerWidth,
            behavior: "smooth",
          });
          setTimeout(() => { scrollLockRef.current = false; }, SCROLL_DURATION_MS);
          return;
        }

        if (delta > 0 && isAtBottom) {
          event.preventDefault();
          return;
        }
      }

      event.preventDefault();

      if (Math.abs(delta) > 10) {
        let targetSection = currentSection;
        if (delta > 0) {
          targetSection = Math.min(currentSection + 1, 4);
        } else {
          targetSection = Math.max(currentSection - 1, 0);
        }

        scrollLockRef.current = true;
        scrollContainer.scrollTo({
          left: targetSection * containerWidth,
          behavior: "smooth",
        });
        setTimeout(() => { scrollLockRef.current = false; }, SCROLL_DURATION_MS);
      }
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <AppBackground>
      <main className="relative h-dvh min-h-dvh overflow-hidden">
        <div className="fixed inset-0 z-5 bg-black/50" />

        <LandingFloatingNavbar />

        <div
          ref={scrollContainerRef}
          className="relative z-10 flex h-dvh min-h-dvh w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <section id="home" className="flex min-w-full snap-start items-center justify-center px-4 py-20">
            <div className="mx-auto max-w-4xl">
              <div className="px-0 text-center leading-5">
                <div className="mb-6 flex justify-center">
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/45 px-4 py-2 shadow-[0_14px_30px_rgba(0,0,0,0.34)] backdrop-blur-md">
                    <Image src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7" aria-hidden="true" priority />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">CommitD</span>
                  </div>
                </div>
                <h1 className="mb-8 text-balance text-5xl tracking-tight text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] md:text-6xl lg:text-8xl">
                  <span className="font-open-sans-custom not-italic">CommitD</span>{" "}
                  <span className="font-serif italic">Lock in</span>{" "}
                  <span className="font-open-sans-custom not-italic">your today.</span>
                </h1>

                <p className="mx-auto mb-8 max-w-2xl text-pretty text-xl  text-gray-300 [text-shadow:0_2px_10px_rgb(0_0_0/50%)]font-open-sans-custom font-thin tracking-wide leading-relaxed">
                  Weekly planning, habits, tasks, and finances—one system, one dashboard.
                </p>

                <div className="flex justify-center">
                  <Link href="/signin">
                    <LandingShinyButton className="px-8 py-3 text-base">Start now</LandingShinyButton>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="flex min-w-full snap-start items-center justify-center px-4 py-20">
            <div className="mx-auto w-full max-w-7xl">
              <LandingFeatureWithAdvantages />
            </div>
          </section>

          <section
            id="pricing"
            ref={pricingSectionRef}
            className="relative min-w-full snap-start overflow-y-auto px-4 pb-20 pt-24 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 z-0 size-full",
                "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]",
                "bg-size-[12px_12px]",
                "opacity-30",
              )}
            />

            <div className="relative z-10 mx-auto w-full max-w-5xl">
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-white [text-shadow:0_4px_20px_rgb(0_0_0/60%)] lg:text-6xl font-open-sans-custom">
                  How CommitD Works
                </h1>
                <p className="mt-4 text-sm text-gray-300 [text-shadow:0_2px_10px_rgb(0_0_0/50%)] md:text-base font-open-sans-custom">
                  Set it up once. Log daily in seconds. Review weekly. Improve monthly.
                </p>
              </div>
              <LandingBentoPricing />
            </div>
          </section>

          <section
            id="contact"
            ref={contactSectionRef}
            className="relative min-w-full snap-start overflow-y-auto px-4 pb-20 pt-24 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 z-0 size-full",
                "bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]",
                "bg-size-[12px_12px]",
                "opacity-30",
              )}
            />

            <div className="relative z-10 mx-auto mt-[5vh] w-full max-w-5xl">
              <LandingContactCard
                title="Ready to lock in?"
                description="Start today—your future self will thank you."
                contactInfo={[
                  {
                    icon: MailIcon,
                    label: "Weekly Planner",
                    value: "Plan the week. Execute day by day.",
                  },
                  {
                    icon: PhoneIcon,
                    label: "Habit Tracker",
                    value: "Track habits with mood + motivation.",
                  },
                  {
                    icon: MapPinIcon,
                    label: "Dashboard",
                    value: "Everything you do, summarized clearly.",
                    className: "col-span-2",
                  },
                ]}
              >
                <form action="" className="w-full space-y-4">
                  <div className="flex flex-col gap-2">
                    <LandingLabel className="text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)] font-open-sans-custom">
                      Name
                    </LandingLabel>
                    <LandingInput
                      type="text"
                      className="border-white/20 bg-white/10 text-white placeholder:text-gray-400 [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <LandingLabel className="text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)] font-open-sans-custom">
                      Email
                    </LandingLabel>
                    <LandingInput 
                      type="email"
                      className="border-white/20 bg-white/10 text-white placeholder:text-gray-400 [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <LandingLabel className="text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)] font-open-sans-custom">
                      Goal
                    </LandingLabel>
                    <LandingInput
                      type="text"
                      className="border-white/20 bg-white/10 text-white placeholder:text-gray-400 [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
                      placeholder="What are you locking in?"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <LandingLabel className="text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)] font-open-sans-custom">
                      Message
                    </LandingLabel>
                    <LandingTextarea
                      className="border-white/20 bg-white/10 text-white placeholder:text-gray-400 [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
                      placeholder="Optional note"
                    />
                  </div>
                  <Link href="/signin" className="block">
                    <LandingButton
                      className="w-full bg-white text-black hover:bg-gray-100 [text-shadow:0_1px_2px_rgb(0_0_0/10%)] font-open-sans-custom"
                      type="button"
                    >
                      Start now
                    </LandingButton>
                  </Link>
                </form>
              </LandingContactCard>
            </div>
          </section>
        </div>
      </main>
    </AppBackground>
  );
}
