import type { Metadata } from "next";
import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-price">Trade the real market.</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Live prices, real tickers, simulated cash. An admin adds funds to your account once
        you&apos;re in.
      </p>
      <AuthForm mode="signup" action={signUp} />
    </>
  );
}
