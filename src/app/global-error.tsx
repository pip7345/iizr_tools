"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6 py-16">
        <div className="max-w-xl rounded-[2rem] border border-black/10 bg-white p-10 shadow-[0_20px_100px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.26em] text-black/40">Unhandled error</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
            The application hit an unexpected failure.
          </h1>
          <p className="mt-4 text-base leading-8 text-black/65">
            This global error boundary prevents a blank screen and gives users a recovery path.
          </p>
          <Button className="mt-8" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
