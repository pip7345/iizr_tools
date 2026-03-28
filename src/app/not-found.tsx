import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="max-w-xl rounded-lg border border-[hsl(var(--border))] card-gradient p-10 text-center shadow-lg">
        <p className="text-xs uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))]">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          This route does not exist
        </h1>
        <p className="mt-4 text-base leading-8 text-[hsl(var(--muted-foreground))]">
          The starter includes a global not-found page so unmatched routes fail cleanly in production.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full btn-gradient px-5 text-sm font-medium text-white shadow-lg transition hover:opacity-90"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
