"use client";

import { useActionState, useEffect, useRef } from "react";

import { adminCreateCreditAction } from "@/actions/admin-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";

const initialState: ActionState = { status: "idle" };

type User = { id: string; name: string; email: string };

type AdminCreditFormProps = {
  users: User[];
};

export function AdminCreditForm({ users }: AdminCreditFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(adminCreateCreditAction, initialState);

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
        Create credit transaction
      </h2>

      <div className="space-y-2">
        <label htmlFor="admin-credit-userId" className="text-sm font-medium text-[hsl(var(--foreground))]">User</label>
        <select
          id="admin-credit-userId"
          name="userId"
          required
          className="h-11 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm"
        >
          <option value="">Select user...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        <FormMessage message={state.errors?.userId?.[0]} tone="error" />
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-credit-amount" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Amount (positive = award, negative = deduction)
        </label>
        <Input id="admin-credit-amount" name="amount" type="number" required />
        <FormMessage message={state.errors?.amount?.[0]} tone="error" />
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-credit-description" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Description
        </label>
        <Input id="admin-credit-description" name="description" placeholder="Reason for credit" required />
        <FormMessage message={state.errors?.description?.[0]} tone="error" />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : state.status === "error" ? "error" : "default"}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create transaction"}
      </Button>
    </form>
  );
}
