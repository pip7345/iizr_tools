"use client";

import { useActionState, useEffect, useRef } from "react";

import { addInvitationCreditAction } from "@/actions/invitation-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

type InvitationCreditFormProps = {
  userId: string;
};

export function InvitationCreditForm({ userId }: InvitationCreditFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addInvitationCreditAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3] p-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex-1 space-y-1">
        <label className="text-xs text-[hsl(var(--muted-foreground))]">Amount</label>
        <Input name="amount" type="number" min="1" placeholder="100" required className="h-9" />
      </div>
      <div className="flex-[2] space-y-1">
        <label className="text-xs text-[hsl(var(--muted-foreground))]">Description</label>
        <Input name="description" placeholder="Signup bonus" required className="h-9" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending} className="h-9 px-3 text-xs">
        {pending ? "Adding..." : "Add credit"}
      </Button>
      <FormMessage message={state.message} tone={state.status === "error" ? "error" : "default"} />
    </form>
  );
}
