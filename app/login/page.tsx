"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error"); // next-auth passes ?error=CredentialsSignin, etc.

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await signIn("credentials", {
      identifier,
      password,
      callbackUrl: "/",
    });
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      {/* Top brand bar */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-violet-500" />
          <span className="text-lg font-semibold tracking-tight">Groovo</span>
        </div>
      </div>

      {/* Center card */}
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Welcome back. Enter your details to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error === "CredentialsSignin"
                ? "Invalid credentials. Please try again."
                : "Something went wrong. Please try again."}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm text-zinc-300">
                Email or username
              </label>
              <input
                id="identifier"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none ring-0 focus:border-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-zinc-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Continue"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px w-full bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              or
            </span>
            <div className="h-px w-full bg-white/10" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            {/* Google icon (SVG) */}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              focusable="false"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3 14.6 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.1 0 9.2-4.3 9.2-8.3 0-.6-.1-1-.2-1.5H12z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-zinc-500">
            By continuing you agree to our{" "}
            <a className="underline decoration-dotted underline-offset-4" href="#">
              Terms
            </a>{" "}
            and{" "}
            <a className="underline decoration-dotted underline-offset-4" href="#">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
