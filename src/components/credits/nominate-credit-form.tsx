"use client";

import { useActionState, useEffect, useRef } from "react";

import { nominateCreditAction } from "@/actions/credit-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

type Recruit = {
  id: string;
  name: string | null;
  email: string;
};

type NominateCreditFormProps = {
  recruits: Recruit[];
};

export function NominateCreditForm({ recruits }: NominateCreditFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(nominateCreditAction, initialState);

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
      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Nominate credits</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Nominate credits for a recruit. Requires admin approval.
      </p>

      <div className="space-y-2">
        <label htmlFor="nom-userId" className="text-sm font-medium text-[hsl(var(--foreground))]">Recruit</label>
        <select
          id="nom-userId"
          name="userId"
          required
          className="h-11 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))/0.2]"
        >
          <option value="">Select a recruit...</option>
          {recruits.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name ?? r.email}
            </option>
          ))}
        </select>
        <FormMessage message={state.errors?.userId?.[0]} tone="error" />
      </div>

      <div className="space-y-2">
        <label htmlFor="nom-amount" className="text-sm font-medium text-[hsl(var(--foreground))]">Amount</label>
        <Input id="nom-amount" name="amount" type="number" min="1" required />
        <FormMessage message={state.errors?.amount?.[0]} tone="error" />
      </div>

      <div className="space-y-2">
        <label htmlFor="nom-description" className="text-sm font-medium text-[hsl(var(--foreground))]">Description</label>
        <Input id="nom-description" name="description" placeholder="Reason for credit" required />
        <FormMessage message={state.errors?.description?.[0]} tone="error" />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : state.status === "error" ? "error" : "default"}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit nomination"}
      </Button>
    </form>
  );
}
