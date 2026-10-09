import type { Metadata } from "next";
import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="font-display text-price">Welcome back.</h1>
      <p className="mt-3 text-muted">Sign in to see your portfolio.</p>
      {error === "link" && (
        <p role="alert" className="mt-6 text-sm text-loss">
          That sign-in link expired or was already used. Sign in with your password instead.
        </p>
      )}
      <AuthForm mode="login" action={signIn} next={typeof next === "string" ? next : undefined} />
    </>
  );
}
