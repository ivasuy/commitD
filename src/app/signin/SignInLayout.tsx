"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleIcon } from "@/src/components/ui/google-icon";

import AppBackground from "@/src/components/shell/AppBackground";
import { GlassButton, GlassCard } from "@/src/components/ui";
import Input from "@/src/components/ui/Input";
import { ShinyButton } from "@/src/components/ui/shiny-button";
import { useAuth } from "@/src/hooks/useAuth";

export function SignInLayout() {
  const { user, loading: authLoading, signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get("redirect");
    return redirect && redirect.startsWith("/") ? redirect : "/dashboard";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isRedirecting) {
      setIsRedirecting(true);
      router.replace("/dashboard");
    }
  }, [user, router, isRedirecting]);

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmail(email, password);
      setIsRedirecting(true);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      setIsRedirecting(true);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isRedirecting) {
    return (
      <AppBackground>
        <div className="flex min-h-dvh items-center justify-center px-4 py-12">
          <div className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm text-white/70">
            {isRedirecting ? "Redirecting to dashboard..." : "Loading..."}
          </div>
        </div>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <div className="flex min-h-dvh items-center justify-center px-4 py-12">
        <GlassCard className="w-full max-w-md p-6">
          <header className="text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.26)]">
              <Image
                src="/logo.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
                aria-hidden="true"
                priority
              />
              <p className="text-sm font-semibold tracking-[0.3em] text-white/60">CommitD</p>
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-white/70">
              Sign in to continue your productivity dashboard.
            </p>
          </header>

          <div className="mt-6 space-y-3">
            <GlassButton
              type="button"
              variant="glass-outline"
              onClick={handleGoogleSignIn}
              className="inline-flex w-full items-center justify-center gap-3"
              disabled={loading}
            >
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </GlassButton>
          </div>

          <div className="my-6 flex items-center gap-2 text-xs text-white/60">
            <span className="h-px flex-1 bg-white/20" />
            OR
            <span className="h-px flex-1 bg-white/20" />
          </div>

          <form className="space-y-4" onSubmit={handleEmailSignIn}>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-white/90">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-white/90">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <ShinyButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </ShinyButton>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-white hover:underline">
              Create an account
            </Link>
          </p>
        </GlassCard>
      </div>
    </AppBackground>
  );
}
