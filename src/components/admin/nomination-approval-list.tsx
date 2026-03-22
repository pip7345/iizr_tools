"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  user: { id: string; name: string | null; email: string };
  nominator: { id: string; name: string | null; email: string };
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
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
        No pending credit nominations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-black/55">
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
          className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm"
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
                  <p className="font-medium text-[var(--color-foreground)]">
                    {nom.description}
                  </p>
                  <p className="text-sm text-black/55">
                    For: {nom.user.name ?? nom.user.email} · By: {nom.nominator.name ?? nom.nominator.email}
                  </p>
                </div>
                <span className="font-mono text-lg font-semibold text-[var(--color-sage)]">
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
