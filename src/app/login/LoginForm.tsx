"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        placeholder="Password"
        autoFocus
        required
        autoComplete="current-password"
        className="rounded-lg border border-line px-3 py-2.5 outline-none focus:border-line-strong"
      />
      <button
        disabled={pending}
        className="rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-text disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </form>
  );
}
