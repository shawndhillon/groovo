"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("credentials", {
      identifier,
      password,
      callbackUrl: "/",
    });
  }

  return (
    <main>
      <h1>Sign in</h1>

      <form onSubmit={onSubmit}>
        <input
          placeholder="Email or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button type="submit">Continue</button>
      </form>

      <button onClick={() => signIn("google", { callbackUrl: "/" })}>
        Continue with Google
      </button>
    </main>
  );
}
