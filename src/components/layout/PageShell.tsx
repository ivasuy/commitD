"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  ListChecks,
  PiggyBank,
  Crown,
  Sparkles,
} from "lucide-react";

import { usePaywall } from "@/src/components/paywall/PaywallContext";
import { GlassCard } from "@/src/components/ui";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { cn } from "@/src/lib/cn";

interface PageShellProps {
  title: string;
  subtitle?: string;
  brandLabel?: string;
  upgradeButtonMode?: "text" | "icon";
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/weekly-planner", label: "Weekly", icon: CalendarDays },
  { href: "/habit-tracker", label: "Habits", icon: BarChart3 },
  { href: "/task-tracker", label: "Tasks", icon: ListChecks },
  { href: "/finance-tracker", label: "Finance", icon: PiggyBank },
];

export default function PageShell({
  title,
  subtitle,
  brandLabel = "CommitD",
  upgradeButtonMode = "icon",
  rightAction,
  children,
  className,
}: PageShellProps) {
  const pathname = usePathname();
  const { openUpgrade, canOpenUpgrade } = usePaywall();

  return (
    <div className="w-full overflow-visible">
      <header className="sticky top-0 z-999 bg-linear-to-b from-black/55 to-transparent px-4 pb-2 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2">
          <div className="flex select-none items-center gap-2.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <Image
              src="/logo.svg"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
              aria-hidden="true"
              priority
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/55">
              {brandLabel}
            </p>
          </div>
          <nav
            className="w-fit max-w-full rounded-[999px] border border-white/12 bg-black/45 px-2 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.48)] backdrop-blur-xl"
            aria-label="Main"
          >
            <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
              {NAV.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label={label}
                    title={label}
                    className={cn(
                      "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
                      isActive
                        ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                        : "text-white/65 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : "")} aria-hidden />
                    <span
                      className={cn(
                        "pointer-events-none absolute -bottom-[0.24rem] h-0.5 w-5 rounded-full transition",
                        isActive
                          ? "bg-emerald-300 opacity-100"
                          : "bg-white/45 opacity-0 group-hover:opacity-70",
                      )}
                    />
                  </Link>
                );
              })}
              {canOpenUpgrade ? (
                <>
                  <span
                    aria-hidden
                    className="h-6 w-px shrink-0 bg-white/12"
                  />
                  {upgradeButtonMode === "icon" ? (
                    <ShinyButton
                      type="button"
                      onClick={openUpgrade}
                      title="Upgrade"
                      aria-label="Upgrade"
                      className="flex h-10 w-10 shrink-0 scale-100 items-center justify-center rounded-full px-0 py-0"
                    >
                      <Crown className="h-5 w-5 shrink-0" aria-hidden />
                    </ShinyButton>
                  ) : (
                    <ShinyButton
                      type="button"
                      onClick={openUpgrade}
                      className="h-10 shrink-0 scale-100 rounded-full px-3 py-0 text-[11px] tracking-[0.14em]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        Upgrade
                      </span>
                    </ShinyButton>
                  )}
                </>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      <div className="w-full px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl flex-col space-y-6 md:space-y-8",
            className,
          )}
        >
          <GlassCard className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
                {subtitle ? (
                  <p className="mt-2 text-sm text-white/70 sm:text-base">{subtitle}</p>
                ) : null}
              </div>

              {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
            </div>
          </GlassCard>

          <div className="flex min-w-0 flex-col space-y-6 md:space-y-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
