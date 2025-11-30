"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Header from "@/app/components/Header";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to create account.");
        setSubmitting(false);
        return;
      }

      // Auto sign-in with credentials provider (your login already uses `identifier`)
      await signIn("credentials", {
        identifier: email, // or username (your credentials authorize should accept either)
        password,
        callbackUrl: "/",
      });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />

      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Join Groovo to share reviews and discover music.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-zinc-300">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none ring-0 focus:border-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-zinc-300">Username</label>
              <input
                id="username"
                placeholder="musiclover23"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none ring-0 focus:border-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-zinc-300">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm" className="text-sm text-zinc-300">Confirm password</label>
              <input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-600 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px w-full bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">or</span>
            <div className="h-px w-full bg-white/10" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            {/* Google icon */}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3 14.6 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.1 0 9.2-4.3 9.2-8.3 0-.6-.1-1-.2-1.5H12z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <a href="/login" className="text-violet-300 hover:text-violet-200">Sign in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
