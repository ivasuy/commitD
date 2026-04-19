"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

const LiquidMetal = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => mod.LiquidMetal),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-[#0a0a0a]" /> },
);

interface AppBackgroundProps {
  children: ReactNode;
}

export default function AppBackground({ children }: AppBackgroundProps) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a]">
      <div className="fixed inset-0 z-0 bg-[#0a0a0a]">
        <LiquidMetal
          width="100%"
          height="100%"
          style={{ width: "100%", height: "100%", display: "block" }}
          colorBack="#0a0a0a"
          colorTint="#1a1a2e"
        />
        <div
          className="absolute inset-0 bg-linear-to-b from-black/60 via-black/50 to-black/70"
          aria-hidden
        />
      </div>
      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}
