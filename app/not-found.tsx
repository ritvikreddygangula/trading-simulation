import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="font-display text-price text-muted">404</p>
      <h1 className="mt-4 text-xl">This page doesn&apos;t exist yet.</h1>
      <Link href="/" className="mt-6 text-sm text-brass hover:text-brass-hover">
        Back to portfolio
      </Link>
    </main>
  );
}
