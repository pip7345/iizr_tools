"use client";

import { useActionState, useEffect, useRef } from "react";

import { createInvitationAction } from "@/actions/invitation-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

export function InvitationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createInvitationAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
        Create invitation
      </h2>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Name
        </label>
        <Input id="name" name="name" placeholder="Jane Doe" required />
        <FormMessage message={state.errors?.name?.[0]} tone="error" />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : state.status === "error" ? "error" : "default"}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Generate Invitation Link"}
      </Button>
    </form>
  );
}
