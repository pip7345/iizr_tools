import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="max-w-xl rounded-[2rem] border border-black/10 bg-white p-10 text-center shadow-[0_20px_100px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.26em] text-black/40">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          This route does not exist
        </h1>
        <p className="mt-4 text-base leading-8 text-black/65">
          The starter includes a global not-found page so unmatched routes fail cleanly in production.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(212,86,39,0.28)] transition hover:bg-[var(--color-accent-strong)]"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
