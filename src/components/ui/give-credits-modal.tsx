"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { adminCreateCreditAction } from "@/actions/admin-actions";
import { nominateCreditAction } from "@/actions/credit-actions";
import type { ActionState } from "@/actions/user-actions";

const initialState: ActionState = { status: "idle" };

// Exported so other components can reuse the type
export type CreditCategoryOption = {
  name: string;
  defaultAmount: number;
};

type GiveCreditsModalProps = {
  /** Pre-set target user id. Required when isAdmin=true. Optional for nominate mode. */
  userId?: string;
  /** Display name shown in the header subtitle */
  userName?: string;
  /** Recruits list. Shown as a selector inside the modal when userId is not provided (nominate mode). */
  recruits?: { id: string; name: string | null; email: string | null }[];
  /** CreditCategory rows from the DB */
  categories: CreditCategoryOption[];
  /** When true: uses adminCreateCreditAction (auto-approved). When false: uses nominateCreditAction (pending). */
  isAdmin: boolean;
  onClose: () => void;
};

type ServerAction = (state: ActionState, payload: FormData) => Promise<ActionState>;

export function GiveCreditsModal({
  userId,
  userName,
  recruits,
  categories,
  isAdmin,
  onClose,
}: GiveCreditsModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState("");

  const creditAction = (isAdmin ? adminCreateCreditAction : nominateCreditAction) as ServerAction;
  const [state, formAction, pending] = useActionState(creditAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setAmount("");
      router.refresh();
      onClose();
    }
  }, [state.status, router, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const cat = categories.find((c) => c.name === e.target.value);
    setAmount(cat ? String(cat.defaultAmount) : "");
  }

  const inputCls =
    "w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]";

  const title = isAdmin ? "Give credits" : "Nominate credits";
  const submitLabel = isAdmin ? "Give credits" : "Submit nomination";

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] card-gradient p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{title}</h2>
            {userName && (
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                For{" "}
                <span className="font-medium text-[hsl(var(--foreground))]">{userName}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted)/0.4)] hover:text-[hsl(var(--foreground))]"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Recruit / user selector */}
          {userId ? (
            <input type="hidden" name="userId" value={userId} />
          ) : recruits && recruits.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                Recruit <span className="text-red-400">*</span>
              </label>
              <select name="userId" required className={inputCls}>
                <option value="">Select a recruit…</option>
                {recruits.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name ?? r.email ?? r.id}
                  </option>
                ))}
              </select>
              {state.errors?.userId && (
                <p className="text-xs text-red-400">{state.errors.userId[0]}</p>
              )}
            </div>
          ) : null}

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              name="category"
              required
              className={inputCls}
              onChange={handleCategoryChange}
              defaultValue=""
            >
              <option value="" disabled>— select category —</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {state.errors?.category && (
              <p className="text-xs text-red-400">{state.errors.category[0]}</p>
            )}
          </div>

          {/* Amount — read-only, populated by category selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">
              Amount
            </label>
            <input
              name="amount"
              type="number"
              required
              readOnly
              value={amount}
              placeholder="Select a category above"
              className={`${inputCls} cursor-not-allowed opacity-70`}
            />
            {state.errors?.amount && (
              <p className="text-xs text-red-400">{state.errors.amount[0]}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={2}
              placeholder="Reason for awarding these credits"
              className={`${inputCls} resize-none`}
            />
            {state.errors?.description && (
              <p className="text-xs text-red-400">{state.errors.description[0]}</p>
            )}
          </div>

          {/* Status notice */}
          {isAdmin ? (
            <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              Credits will be <strong>immediately applied</strong> as an admin direct grant.
            </p>
          ) : (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              ⚠ Nominated credits require <strong>admin approval</strong> before they take
              effect.
            </p>
          )}

          {/* General error */}
          {state.status === "error" && !state.errors && (
            <p className="text-xs text-red-400">{state.message}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[hsl(var(--border))] px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Submitting…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

