import type { Metadata } from "next";
import "./globals.css";
import { fonts } from "@/src/app/fonts";

export const metadata: Metadata = {
  title: "CommitD - Productivity Dashboard",
  description:
    "CommitD - be the master of your today and everyday. Weekly planner, habit tracker, task tracker, and finance tracker.",
};

const fontClassNames = [
  fonts.openSans.variable,
  fonts.rubik.variable,
  fonts.instrumentSerif.variable,
  fonts.geist.variable,
  fonts.geistMono.variable,
  fonts.sourceSerif.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontClassNames} style={{ backgroundColor: "#0a0a0a" }}>
      <body className="min-h-dvh font-sans antialiased bg-[#0a0a0a]">
        {children}
      </body>
    </html>
  );
}
