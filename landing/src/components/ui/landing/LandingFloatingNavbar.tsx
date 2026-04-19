"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useCallback } from "react";

import { LandingButton } from "@/src/components/ui/landing/LandingButton";

export function LandingFloatingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
    setMobileMenuOpen(false);
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto max-w-7xl rounded-2xl border-2 border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => scrollToSection("home")} className="cursor-pointer" type="button">
            <div className="flex items-center gap-2.5 text-white [text-shadow:0_2px_8px_rgb(0_0_0/40%)]">
              <Image src="/logo.svg" alt="CommitD logo" width={32} height={32} className="h-7 w-7 md:h-8 md:w-8" priority />
              <span className="hidden text-xs font-semibold uppercase tracking-[0.28em] text-white/70 sm:inline">
                CommitD
              </span>
            </div>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
              type="button"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
              type="button"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="inline-flex items-center gap-1 text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:0_2px_6px_rgb(0_0_0/40%)]"
              type="button"
            >
              Pricing
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/signup" className="hidden sm:block">
              <LandingButton
                size="sm"
                className="bg-white text-black hover:bg-gray-100 [text-shadow:_0_1px_2px_rgb( 0_0_0_/_10%)] font-open-sans-custom"
              >
                Create account
              </LandingButton>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 md:hidden">
            <button
              onClick={() => scrollToSection("features")}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-open-sans-custom text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              type="button"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-open-sans-custom text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              type="button"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="rounded-lg px-3 py-2.5 text-left text-sm font-open-sans-custom text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              type="button"
            >
              Pricing
            </button>
            <Link
              href="/signup"
              className="mt-2 block rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-black transition-colors hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
