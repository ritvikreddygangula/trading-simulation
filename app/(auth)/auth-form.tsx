"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthState } from "./actions";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
}

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      {!isLogin && <Input label="Name" name="name" autoComplete="name" />}
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        minLength={isLogin ? undefined : 8}
        required
      />

      {state.error && (
        <p role="alert" className="text-sm text-loss">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-gain">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="text-brass hover:text-brass-hover"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
