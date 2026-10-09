import type { Metadata } from "next";
import { Suspense } from "react";
import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="font-display text-price">Welcome back.</h1>
      <p className="mt-3 text-muted">Sign in to see your portfolio.</p>
      <Suspense fallback={<AuthForm mode="login" action={signIn} />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  return (
    <>
      {error === "link" && (
        <p role="alert" className="mt-6 text-sm text-loss">
          That sign-in link expired or was already used. Sign in with your password instead.
        </p>
      )}
      <AuthForm mode="login" action={signIn} next={typeof next === "string" ? next : undefined} />
    </>
  );
}
