"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import {
  approveNominationAction,
  approveNominationsBulkAction,
  rejectNominationAction,
} from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Nomination = {
  id: string;
  amount: number;
  description: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string | null };
  nominator: { id: string; name: string | null; email: string | null } | null;
};

type NominationApprovalListProps = {
  nominations: Nomination[];
};

export function NominationApprovalList({ nominations }: NominationApprovalListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === nominations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nominations.map((n) => n.id)));
    }
  }

  async function handleBulkApprove() {
    if (selected.size === 0) return;
    await approveNominationsBulkAction(Array.from(selected));
    setSelected(new Set());
    router.refresh();
  }

  async function handleApprove(id: string) {
    await approveNominationAction(id);
    router.refresh();
  }

  async function handleReject(id: string, formData: FormData) {
    await rejectNominationAction(id, formData);
    setRejectingId(null);
    router.refresh();
  }

  if (nominations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        No pending credit nominations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <input
            type="checkbox"
            checked={selected.size === nominations.length}
            onChange={toggleAll}
            className="rounded"
          />
          Select all
        </label>
        {selected.size > 0 && (
          <Button variant="primary" onClick={handleBulkApprove} className="text-xs">
            Approve {selected.size} selected
          </Button>
        )}
      </div>

      {nominations.map((nom) => (
        <article
          key={nom.id}
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has(nom.id)}
              onChange={() => toggleSelect(nom.id)}
              className="mt-1 rounded"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {nom.description}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    For:{" "}
                    <Link href={`/users/${nom.user.id}` as Route} className="hover:text-[hsl(var(--primary))] hover:underline">
                      {nom.user.name ?? nom.user.email ?? nom.user.id}
                    </Link>
                    {" "}·{" "}
                    By:{" "}
                    {nom.nominator ? (
                      <Link href={`/users/${nom.nominator.id}` as Route} className="hover:text-[hsl(var(--primary))] hover:underline">
                        {nom.nominator.name ?? nom.nominator.email ?? nom.nominator.id}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <span className="font-mono text-lg font-semibold text-emerald-400">
                  +{nom.amount}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="primary" onClick={() => handleApprove(nom.id)} className="text-xs">
                  Approve
                </Button>
                <Button variant="danger" onClick={() => setRejectingId(nom.id)} className="text-xs">
                  Reject
                </Button>
              </div>

              {rejectingId === nom.id && (
                <form
                  action={(formData) => handleReject(nom.id, formData)}
                  className="mt-3 flex gap-2"
                >
                  <Input name="reason" placeholder="Rejection reason..." required className="h-9" />
                  <Button type="submit" variant="danger" className="h-9 text-xs">
                    Confirm reject
                  </Button>
                  <Button variant="ghost" onClick={() => setRejectingId(null)} className="h-9 text-xs">
                    Cancel
                  </Button>
                </form>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
