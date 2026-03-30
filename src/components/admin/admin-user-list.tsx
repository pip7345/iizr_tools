"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import {
  grantAdminAction,
  revokeAdminAction,
  startImpersonationAction,
  reassignSponsorAction,
} from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  preferredDisplayName: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "PENDING_SIGNUP";
  sponsorId: string | null;
  joinedAt: Date;
  sponsor: { id: string; name: string | null; email: string | null } | null;
  _count: { recruits: number };
};

type AdminUserListProps = {
  users: UserRow[];
  currentAdminId: string;
  creditBalances: Record<string, number>;
};

export function AdminUserList({ users, currentAdminId, creditBalances }: AdminUserListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/admin/users?${params.toString()}` as Route);
  }

  async function handleGrantAdmin(userId: string) {
    await grantAdminAction(userId);
    router.refresh();
  }

  async function handleRevokeAdmin(userId: string) {
    await revokeAdminAction(userId);
    router.refresh();
  }

  async function handleImpersonate(userId: string) {
    await startImpersonationAction(userId);
    router.push("/dashboard");
    router.refresh();
  }

  async function handleRemoveSponsor(userId: string) {
    await reassignSponsorAction(userId, null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING_SIGNUP">Pending Signup</option>
        </select>
        <Button variant="secondary" onClick={applyFilters}>
          Filter
        </Button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/users/${user.id}` as Route}
                    className="text-base font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline"
                  >
                    {user.preferredDisplayName ?? user.name ?? user.email ?? user.id}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-[hsl(var(--muted))/0.5] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    {user.role.toLowerCase()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : user.status === "PENDING_SIGNUP"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.status.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{
user.email ?? <span className="opacity-40 italic">no email</span>}</p>
                <div className="flex flex-wrap gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <span>{user._count.recruits} recruit{user._count.recruits === 1 ? "" : "s"}</span>
                  <span className={(creditBalances[user.id] ?? 0) >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                    {(creditBalances[user.id] ?? 0) >= 0 ? "+" : ""}{(creditBalances[user.id] ?? 0).toLocaleString()} credits
                  </span>
                  {user.sponsor && (
                    <span>
                      Sponsor:{" "}
                      <Link
                        href={`/users/${user.sponsor.id}` as Route}
                        className="hover:text-[hsl(var(--primary))] hover:underline"
                      >
                        {user.sponsor.name ?? user.sponsor.email ?? user.sponsor.id}
                      </Link>
                    </span>
                  )}
                  {!user.sponsor && <span>No sponsor</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.id !== currentAdminId && (
                  <>
                    {user.role === "USER" ? (
                      <Button variant="secondary" onClick={() => handleGrantAdmin(user.id)} className="text-xs">
                        Grant admin
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => handleRevokeAdmin(user.id)} className="text-xs">
                        Revoke admin
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => handleImpersonate(user.id)} className="text-xs">
                      Impersonate
                    </Button>
                    {user.sponsorId && (
                      <Button variant="ghost" onClick={() => handleRemoveSponsor(user.id)} className="text-xs">
                        Remove sponsor
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </article>
        ))}

        {users.length === 0 && (
          <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No users match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
