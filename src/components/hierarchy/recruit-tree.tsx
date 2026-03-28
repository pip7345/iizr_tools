"use client";

import { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";

import { nominateCreditAction } from "@/actions/credit-actions";
import type { ActionState } from "@/actions/user-actions";
import { FormMessage } from "@/components/ui/form-message";

type Recruit = {
  id: string;
  name: string | null;
  email: string;
  preferredDisplayName: string | null;
  role: string;
  status: string;
  joinedAt: Date;
  creditBalance?: number;
  _count: { recruits: number };
};

type RecruitTreeProps = {
  recruits: Recruit[];
  viewerCanNominate?: boolean;
};

const initialState: ActionState = { status: "idle" };

function NominateForm({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(nominateCreditAction, initialState);

  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state.status, onClose]);

  return (
    <form
      action={formAction}
      className="mt-2 ml-8 space-y-3 rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-black/55">Amount</label>
          <input
            name="amount"
            type="number"
            min="1"
            required
            className="h-8 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[color:color-mix(in_oklab,var(--color-accent)_20%,white)]"
          />
          {state.errors?.amount && (
            <p className="text-xs text-red-600">{state.errors.amount[0]}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-black/55">Reason</label>
          <input
            name="description"
            required
            placeholder="Reason for tokens"
            className="h-8 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[color:color-mix(in_oklab,var(--color-accent)_20%,white)]"
          />
          {state.errors?.description && (
            <p className="text-xs text-red-600">{state.errors.description[0]}</p>
          )}
        </div>
      </div>
      {state.status === "error" && <FormMessage message={state.message} tone="error" />}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Nominate"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-black/40 transition hover:text-black/70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RecruitNode({
  recruit,
  viewerCanNominate,
}: {
  recruit: Recruit;
  viewerCanNominate?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Recruit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [nominating, setNominating] = useState(false);
  const hasChildren = recruit._count.recruits > 0;

  async function toggle() {
    if (!hasChildren) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    if (!children) {
      setLoading(true);
      try {
        const res = await fetch(`/api/recruits/${recruit.id}`);
        if (res.ok) {
          const data = await res.json();
          setChildren(data);
        }
      } finally {
        setLoading(false);
      }
    }
    setExpanded(true);
  }

  const balance = recruit.creditBalance ?? 0;

  return (
    <li className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {hasChildren ? (
          <button
            onClick={toggle}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-black/40 transition hover:bg-black/5"
          >
            {loading ? "…" : expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="inline-block w-6 shrink-0 text-center text-xs text-black/20">·</span>
        )}
        <Link
          href={`/users/${recruit.id}` as Route}
          className="font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)] hover:underline"
        >
          {recruit.preferredDisplayName ?? recruit.name ?? recruit.email}
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
            balance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {balance >= 0 ? "+" : ""}
          {balance} cr
        </span>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/50">
          {recruit._count.recruits} recruit{recruit._count.recruits === 1 ? "" : "s"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            recruit.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {recruit.status.toLowerCase()}
        </span>
        {viewerCanNominate && !nominating && (
          <button
            onClick={() => setNominating(true)}
            className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/15"
          >
            + nominate tokens
          </button>
        )}
      </div>
      {nominating && (
        <NominateForm userId={recruit.id} onClose={() => setNominating(false)} />
      )}
      {expanded && children && children.length > 0 && (
        <ul className="ml-6 space-y-1 border-l border-black/10 pl-2">
          {children.map((child) => (
            <RecruitNode key={child.id} recruit={child} viewerCanNominate={viewerCanNominate} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function RecruitTree({ recruits, viewerCanNominate }: RecruitTreeProps) {
  return (
    <ul className="space-y-1">
      {recruits.map((recruit) => (
        <RecruitNode key={recruit.id} recruit={recruit} viewerCanNominate={viewerCanNominate} />
      ))}
    </ul>
  );
}
