"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { startImpersonationAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function ImpersonateButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await startImpersonationAction(userId);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={pending}>
      {pending ? "Starting…" : "Impersonate"}
    </Button>
  );
}
