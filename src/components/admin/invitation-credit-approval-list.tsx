"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import {
  approveInvitationCreditAction,
  rejectInvitationCreditAction,
} from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Grant = {
  id: string;
  amount: number;
  description: string;
  createdAt: Date;
  invitation: {
    id: string;
    name: string;
    email: string | null;
    sponsor: { id: string; name: string | null };
  };
  nominator: { id: string; name: string | null };
};

type InvitationCreditApprovalListProps = {
  grants: Grant[];
};

export function InvitationCreditApprovalList({ grants }: InvitationCreditApprovalListProps) {
  const router = useRouter();
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    await approveInvitationCreditAction(id);
    router.refresh();
  }

  async function handleReject(id: string, formData: FormData) {
    await rejectInvitationCreditAction(id, formData);
    setRejectingId(null);
    router.refresh();
  }

  if (grants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        No pending invitation credit grants.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grants.map((grant) => (
        <article
          key={grant.id}
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-[hsl(var(--foreground))]">
                {grant.description}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Invitation: {grant.invitation.name}{grant.invitation.email ? ` (${grant.invitation.email})` : ""}
                {" "}·{" "}Sponsor:{" "}
                <Link href={`/users/${grant.invitation.sponsor.id}` as Route} className="hover:text-[hsl(var(--primary))] hover:underline">
                  {grant.invitation.sponsor.name}
                </Link>
                {" "}·{" "}Nominated by:{" "}
                <Link href={`/users/${grant.nominator.id}` as Route} className="hover:text-[hsl(var(--primary))] hover:underline">
                  {grant.nominator.name}
                </Link>
              </p>
            </div>
            <span className="font-mono text-lg font-semibold text-emerald-400">
              +{grant.amount}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={() => handleApprove(grant.id)} className="text-xs">
              Approve
            </Button>
            <Button variant="danger" onClick={() => setRejectingId(grant.id)} className="text-xs">
              Reject
            </Button>
          </div>

          {rejectingId === grant.id && (
            <form
              action={(formData) => handleReject(grant.id, formData)}
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
        </article>
      ))}
    </div>
  );
}
