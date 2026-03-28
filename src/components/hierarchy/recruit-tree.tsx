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
      className="mt-2 ml-8 space-y-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3] px-4 py-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Amount</label>
          <input
            name="amount"
            type="number"
            min="1"
            required
            className="h-8 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))/0.2]"
          />
          {state.errors?.amount && (
            <p className="text-xs text-red-600">{state.errors.amount[0]}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Reason</label>
          <input
            name="description"
            required
            placeholder="Reason for tokens"
            className="h-8 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))/0.2]"
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
          className="rounded-lg bg-[hsl(var(--primary))] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Nominate"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]"
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
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))/0.5]"
          >
            {loading ? "…" : expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="inline-block w-6 shrink-0 text-center text-xs text-[hsl(var(--muted-foreground))/0.5]">·</span>
        )}
        <Link
          href={`/users/${recruit.id}` as Route}
          className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
        >
          {recruit.preferredDisplayName ?? recruit.name ?? recruit.email}
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
            balance >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {balance >= 0 ? "+" : ""}
          {balance} cr
        </span>
        <span className="rounded-full bg-[hsl(var(--muted))/0.5] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]">
          {recruit._count.recruits} recruit{recruit._count.recruits === 1 ? "" : "s"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            recruit.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {recruit.status.toLowerCase()}
        </span>
        {viewerCanNominate && !nominating && (
          <button
            onClick={() => setNominating(true)}
            className="rounded-full border border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.05] px-2 py-0.5 text-xs font-medium text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary))/0.15]"
          >
            + nominate tokens
          </button>
        )}
      </div>
      {nominating && (
        <NominateForm userId={recruit.id} onClose={() => setNominating(false)} />
      )}
      {expanded && children && children.length > 0 && (
        <ul className="ml-6 space-y-1 border-l border-[hsl(var(--border))] pl-2">
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
