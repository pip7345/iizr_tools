"use client";

import { useActionState, useEffect, useRef } from "react";

import { spendCreditsAction } from "@/actions/credit-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

type SpendCreditsFormProps = {
  balance: number;
};

export function SpendCreditsForm({ balance }: SpendCreditsFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(spendCreditsAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Spend credits</h2>
      <p className="text-sm text-black/55">
        Available: <strong>{balance}</strong> credits
      </p>

      <div className="space-y-2">
        <label htmlFor="spend-amount" className="text-sm font-medium text-black/70">Amount</label>
        <Input id="spend-amount" name="amount" type="number" min="1" max={balance} required />
        <FormMessage message={state.errors?.amount?.[0]} tone="error" />
      </div>

      <div className="space-y-2">
        <label htmlFor="spend-description" className="text-sm font-medium text-black/70">Description</label>
        <Input id="spend-description" name="description" placeholder="What are you spending on?" required />
        <FormMessage message={state.errors?.description?.[0]} tone="error" />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : state.status === "error" ? "error" : "default"}
      />

      <Button type="submit" disabled={pending || balance <= 0}>
        {pending ? "Spending..." : "Spend credits"}
      </Button>
    </form>
  );
}
