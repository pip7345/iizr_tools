"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

import {
  UserActionsCell,
  type CreditCategoryOption,
} from "@/components/ui/user-actions-cell";

export type Recruit = {
  id: string;
  name: string | null;
  email: string | null;
  preferredDisplayName: string | null;
  role: string;
  status: string;
  sponsorId?: string | null;
  joinedAt: Date;
  creditBalance?: number;
  _count: { recruits: number };
};

export type RecruitTreeProps = {
  recruits: Recruit[];
  /** ID of the currently logged-in user */
  viewerCurrentUserId: string;
  /** Viewer has full admin powers — show admin action dropdown on every row */
  viewerIsAdmin?: boolean;
  /**
   * Viewer is the direct sponsor of the top-level list.
   * Used to enable "Nominate credits" on top-level rows for non-admin viewers.
   */
  viewerCanNominate?: boolean;
  categories: CreditCategoryOption[];
};

const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400",
  INACTIVE: "bg-red-500/20 text-red-400",
  PENDING_SIGNUP: "bg-amber-500/20 text-amber-400",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING_SIGNUP: "Pending signup",
};

type RecruitRowProps = {
  recruit: Recruit;
  depth: number;
  viewerCurrentUserId: string;
  viewerIsAdmin: boolean;
  /** True only for top-level rows when viewerCanNominate and viewer is not admin */
  isDirectSponsoree: boolean;
  categories: CreditCategoryOption[];
};

function RecruitRow({
  recruit,
  depth,
  viewerCurrentUserId,
  viewerIsAdmin,
  isDirectSponsoree,
  categories,
}: RecruitRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Recruit[] | null>(null);
  const [loading, setLoading] = useState(false);

  const hasChildren = recruit._count.recruits > 0;

  async function toggle() {
    if (!hasChildren) return;
    if (expanded) { setExpanded(false); return; }
    if (!children) {
      setLoading(true);
      try {
        const res = await fetch(`/api/recruits/${recruit.id}`);
        if (res.ok) setChildren(await res.json());
      } finally {
        setLoading(false);
      }
    }
    setExpanded(true);
  }

  const balance = recruit.creditBalance ?? 0;
  const displayName =
    recruit.preferredDisplayName ?? recruit.name ?? recruit.email ?? recruit.id;

  const actionMode = viewerIsAdmin ? "admin" : isDirectSponsoree ? "sponsor" : "none";

  return (
    <Fragment>
      <tr className="border-b border-[hsl(var(--border)/0.5)] transition-colors hover:bg-[hsl(var(--muted)/0.15)]">
        {/* Name + expand toggle */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={toggle}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted)/0.5)]"
              >
                {loading ? "…" : expanded ? "▾" : "▸"}
              </button>
            ) : (
              <span className="inline-block w-5 shrink-0 text-center text-[10px] text-[hsl(var(--muted-foreground)/0.4)]">·</span>
            )}
            <Link
              href={`/users/${recruit.id}` as Route}
              className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
            >
              {displayName}
            </Link>
            {recruit.role === "ADMIN" && (
              <span className="rounded-full bg-[hsl(var(--primary)/0.15)] px-1.5 py-0.5 text-[10px] font-medium text-[hsl(var(--primary))]">
                admin
              </span>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-3 py-2.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[recruit.status] ?? "bg-[hsl(var(--muted)/0.4)] text-[hsl(var(--muted-foreground))]"}`}>
            {STATUS_LABEL[recruit.status] ?? recruit.status}
          </span>
        </td>

        {/* Credits */}
        <td className="px-3 py-2.5 tabular-nums">
          <span className={`text-sm font-medium ${balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {balance >= 0 ? "+" : ""}{balance}
          </span>
        </td>

        {/* Recruit count */}
        <td className="px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))]">
          {recruit._count.recruits}
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5 text-right">
          <UserActionsCell
            user={recruit}
            viewerCurrentUserId={viewerCurrentUserId}
            mode={actionMode}
            categories={categories}
          />
        </td>
      </tr>

      {expanded && children && children.length > 0 && children.map((child) => (
        <RecruitRow
          key={child.id}
          recruit={child}
          depth={depth + 1}
          viewerCurrentUserId={viewerCurrentUserId}
          viewerIsAdmin={viewerIsAdmin}
          isDirectSponsoree={false}
          categories={categories}
        />
      ))}
    </Fragment>
  );
}

export function RecruitTree({
  recruits,
  viewerCurrentUserId,
  viewerIsAdmin = false,
  viewerCanNominate = false,
  categories,
}: RecruitTreeProps) {
  if (recruits.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
            {(["Name", "Status", "Credits", "Recruits", "Actions"] as const).map((label) => (
              <th
                key={label}
                className={`px-3 py-2.5 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))] ${label === "Actions" ? "text-right" : "text-left"}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recruits.map((recruit) => (
            <RecruitRow
              key={recruit.id}
              recruit={recruit}
              depth={0}
              viewerCurrentUserId={viewerCurrentUserId}
              viewerIsAdmin={viewerIsAdmin}
              isDirectSponsoree={!viewerIsAdmin && viewerCanNominate}
              categories={categories}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}


