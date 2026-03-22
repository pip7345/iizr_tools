"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-900">
      <h2 className="text-2xl font-semibold">Dashboard failed to load</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-red-800/80">
        An unexpected error occurred while rendering the protected area or reading project data.
      </p>
      <Button className="mt-6" variant="danger" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
