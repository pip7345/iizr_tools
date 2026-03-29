"use client";

import { useActionState, useTransition, useState, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import type { Route } from "next";

import {
  adminCreateCreditAction,
  adminDeleteCreditAction,
  adminUpdateCreditAction,
} from "@/actions/admin-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";

const initialState: ActionState = { status: "idle" };

export type AdminTransaction = {
  id: string;
  createdAt: string; // ISO string (serialised from server)
  description: string;
  amount: number;
  nominator: { id: string; name: string | null } | null;
  isLinked: boolean;
};

type CreditFormState =
  | { mode: "hidden" }
  | { mode: "create" }
  | { mode: "edit"; transactionId: string; amount: number; description: string };

// ─── Delete Button ────────────────────────────────────────

function DeleteButton({
  transactionId,
  userId,
  isLinked,
}: {
  transactionId: string;
  userId: string;
  isLinked: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex gap-1">
        <button
          onClick={() =>
            startTransition(async () => {
              await adminDeleteCreditAction(transactionId, userId);
              setConfirming(false);
            })
          }
          disabled={isPending}
          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {isPending ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => !isLinked && setConfirming(true)}
      disabled={isLinked}
      title={
        isLinked
          ? "Cannot delete: transaction is linked to a nomination or invitation"
          : "Delete transaction"
      }
      className="rounded px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Delete
    </button>
  );
}

// ─── Main Section ─────────────────────────────────────────

type AdminCreditHistorySectionProps = {
  userId: string;
  transactions: AdminTransaction[];
  total: number;
  page: number;
  totalPages: number;
};

export function AdminCreditHistorySection({
  userId,
  transactions,
  total,
  page,
  totalPages,
}: AdminCreditHistorySectionProps) {
  const safePage = Math.min(page, Math.max(1, totalPages));

  const [formState, setFormState] = useState<CreditFormState>({ mode: "hidden" });
  const [createState, createFormAction, createPending] = useActionState(
    adminCreateCreditAction,
    initialState,
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    adminUpdateCreditAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (createState.status === "success") {
      startTransition(() => setFormState({ mode: "hidden" }));
      formRef.current?.reset();
    }
  }, [createState.status]);

  useEffect(() => {
    if (updateState.status === "success") {
      startTransition(() => setFormState({ mode: "hidden" }));
    }
  }, [updateState.status]);

  const isCreate = formState.mode === "create";
  const isEdit = formState.mode === "edit";
  const showForm = isCreate || isEdit;
  const activeFormAction = isCreate ? createFormAction : updateFormAction;
  const activeState = isCreate ? createState : updateState;
  const activePending = isCreate ? createPending : updatePending;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Credit history
        </h2>
        <Button
          variant="secondary"
          onClick={() =>
            setFormState(
              formState.mode === "create" ? { mode: "hidden" } : { mode: "create" },
            )
          }
          className="h-8 rounded-full px-4 text-xs"
        >
          {isCreate ? "Cancel" : "+ Add transaction"}
        </Button>
      </div>

      {showForm && (
        <form
          ref={formRef}
          action={activeFormAction}
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-4 space-y-3 shadow-sm"
        >
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
            {isCreate ? "New credit transaction" : "Edit credit transaction"}
          </p>

          <input type="hidden" name="userId" value={userId} />
          {isEdit && (
            <input type="hidden" name="transactionId" value={formState.transactionId} />
          )}

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Amount
              </label>
              <Input
                type="number"
                name="amount"
                defaultValue={isEdit ? formState.amount : undefined}
                placeholder="e.g. 100 or -50"
                required
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-48">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Description
              </label>
              <Input
                type="text"
                name="description"
                defaultValue={isEdit ? formState.description : undefined}
                placeholder="Reason for this transaction"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={activePending} className="h-9 text-xs">
              {activePending
                ? "Saving…"
                : isCreate
                  ? "Create"
                  : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormState({ mode: "hidden" })}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
          </div>

          {activeState.status !== "idle" && (
            <FormMessage
              message={activeState.message}
              tone={activeState.status === "error" ? "error" : "success"}
            />
          )}
        </form>
      )}

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No credit transactions yet.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] card-gradient shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3]">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    Description
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    By
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {transactions.map((tx) => {
                  const isActiveEdit =
                    isEdit && formState.mode === "edit" && formState.transactionId === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-[hsl(var(--muted))/0.3] ${isActiveEdit ? "bg-[hsl(var(--muted))/0.4]" : ""}`}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-[hsl(var(--muted-foreground))]">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-[hsl(var(--foreground))]">
                        {tx.description}
                      </td>
                      <td className="px-5 py-3.5 text-[hsl(var(--muted-foreground))]">
                        {tx.nominator ? (
                          <Link
                            href={`/users/${tx.nominator.id}` as Route}
                            className="hover:text-[hsl(var(--primary))] hover:underline"
                          >
                            {tx.nominator.name ?? "—"}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3.5 text-right font-mono font-semibold tabular-nums ${
                          tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() =>
                              setFormState(
                                isActiveEdit
                                  ? { mode: "hidden" }
                                  : {
                                      mode: "edit",
                                      transactionId: tx.id,
                                      amount: tx.amount,
                                      description: tx.description,
                                    },
                              )
                            }
                            className="rounded px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                          >
                            {isActiveEdit ? "Cancel" : "Edit"}
                          </button>
                          <DeleteButton
                            transactionId={tx.id}
                            userId={userId}
                            isLinked={tx.isLinked}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">
                Page {safePage} of {totalPages} &middot; {total} transaction
                {total === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                {safePage > 1 ? (
                  <Link
                    href={`/users/${userId}?page=${safePage - 1}` as Route}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 font-medium shadow-sm"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="rounded-lg border border-[hsl(var(--border))/0.5] px-4 py-1.5 text-[hsl(var(--muted-foreground))/0.5]">
                    ← Previous
                  </span>
                )}
                {safePage < totalPages ? (
                  <Link
                    href={`/users/${userId}?page=${safePage + 1}` as Route}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 font-medium shadow-sm"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="rounded-lg border border-[hsl(var(--border))/0.5] px-4 py-1.5 text-[hsl(var(--muted-foreground))/0.5]">
                    Next →
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
