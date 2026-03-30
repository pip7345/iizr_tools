"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import {
  UserActionsCell,
  type CreditCategoryOption,
} from "@/components/ui/user-actions-cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignupLinkModal } from "@/components/ui/signup-link-modal";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  preferredDisplayName: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "PENDING_SIGNUP";
  sponsorId: string | null;
  joinedAt: Date;
  signupCode?: string | null;
  sponsor: { id: string; name: string | null; email: string | null } | null;
  _count: { recruits: number };
};

type AdminUserListProps = {
  users: UserRow[];
  currentAdminId: string;
  creditBalances: Record<string, number>;
  categories: CreditCategoryOption[];
  page: number;
  totalPages: number;
  total: number;
  currentSearch: string;
  currentRole: string;
  currentStatus: string;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING_SIGNUP: "Pending Signup",
};
const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400",
  INACTIVE: "bg-red-500/20 text-red-400",
  PENDING_SIGNUP: "bg-amber-500/20 text-amber-400",
};

// ─── Pagination helper ────────────────────────────────────

function paginationPages(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 2;
  const pages: (number | null)[] = [1];
  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);
  if (start > 2) pages.push(null);
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push(null);
  pages.push(total);
  return pages;
}

export function AdminUserList({
  users,
  currentAdminId,
  creditBalances,
  categories,
  page,
  totalPages,
  total,
  currentSearch,
  currentRole,
  currentStatus,
}: AdminUserListProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [roleFilter, setRoleFilter] = useState(currentRole);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [signupModal, setSignupModal] = useState<{ code: string; name: string | null } | null>(null);

  function buildUrl(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams();
    const s = overrides.search ?? search;
    const r = overrides.role ?? roleFilter;
    const st = overrides.status ?? statusFilter;
    const p = overrides.page ?? "1";
    if (s) params.set("search", s);
    if (r) params.set("role", r);
    if (st) params.set("status", st);
    if (p !== "1") params.set("page", p);
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}` as Route;
  }

  function applyFilters() {
    router.push(buildUrl({ page: "1" }));
  }

  function goToPage(p: number) {
    router.push(buildUrl({ page: String(p) }));
  }

  const selectCls =
    "h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm text-[hsl(var(--foreground))]";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="h-9 max-w-xs"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectCls}>
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING_SIGNUP">Pending Signup</option>
        </select>
        <Button variant="secondary" onClick={applyFilters} className="h-9">
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] card-gradient shadow-sm">
        {users.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No users match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
                  {["Name", "Status", "Credits", "Recruits", "Sponsor", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2.5 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))] ${i === 5 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {users.map((user) => {
                  const displayName = user.preferredDisplayName ?? user.name ?? user.email ?? user.id;
                  const credits = creditBalances[user.id] ?? 0;
                  return (
                    <tr key={user.id} className="hover:bg-[hsl(var(--muted)/0.15)]">
                      {/* Name */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/users/${user.id}` as Route}
                            className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                          >
                            {displayName}
                          </Link>
                          {user.role === "ADMIN" && (
                            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                              admin
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="whitespace-nowrap px-3 py-3">
                        {user.status === "PENDING_SIGNUP" && user.signupCode ? (
                          <button
                            onClick={() =>
                              setSignupModal({
                                code: user.signupCode!,
                                name: user.preferredDisplayName ?? user.name,
                              })
                            }
                            className={`rounded-full px-2 py-0.5 text-xs font-medium underline decoration-dotted underline-offset-2 transition hover:brightness-125 ${STATUS_CLS[user.status]}`}
                          >
                            {STATUS_LABEL[user.status]}
                          </button>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[user.status] ?? ""}`}>
                            {STATUS_LABEL[user.status] ?? user.status}
                          </span>
                        )}
                      </td>
                      {/* Credits */}
                      <td className={`px-3 py-3 tabular-nums font-medium ${credits >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {credits >= 0 ? "+" : ""}{credits.toLocaleString()}
                      </td>
                      {/* Recruits */}
                      <td className="px-3 py-3 tabular-nums text-[hsl(var(--muted-foreground))]">
                        {user._count.recruits}
                      </td>
                      {/* Sponsor */}
                      <td className="px-3 py-3 text-[hsl(var(--muted-foreground))]">
                        {user.sponsor ? (
                          <Link
                            href={`/users/${user.sponsor.id}` as Route}
                            className="hover:text-[hsl(var(--primary))] hover:underline"
                          >
                            {user.sponsor.name ?? user.sponsor.email ?? user.sponsor.id}
                          </Link>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <UserActionsCell
                          user={user}
                          viewerCurrentUserId={currentAdminId}
                          mode="admin"
                          categories={categories}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
        <span>{total} user{total !== 1 ? "s" : ""}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded border border-[hsl(var(--border))] px-2.5 py-1 text-xs hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))] disabled:opacity-40"
            >
              Prev
            </button>
            {paginationPages(page, totalPages).map((p, i) =>
              p === null ? (
                <span key={`ellipsis-${i}`} className="px-1 text-xs opacity-40">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`rounded border px-2.5 py-1 text-xs ${
                    p === page
                      ? "border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-[hsl(var(--border))] px-2.5 py-1 text-xs hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {signupModal && (
        <SignupLinkModal
          signupCode={signupModal.code}
          userName={signupModal.name}
          onClose={() => setSignupModal(null)}
        />
      )}
    </div>
  );
}

