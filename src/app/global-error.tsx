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
      <body className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-6 py-16">
        <div className="max-w-xl rounded-lg border border-[hsl(var(--border))] card-gradient p-10 shadow-lg">
          <p className="text-xs uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))]">Unhandled error</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            The application hit an unexpected failure.
          </h1>
          <p className="mt-4 text-base leading-8 text-[hsl(var(--muted-foreground))]">
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
