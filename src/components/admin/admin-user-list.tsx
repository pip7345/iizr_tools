"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  email: string;
  preferredDisplayName: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  sponsorId: string | null;
  joinedAt: Date;
  sponsor: { id: string; name: string | null; email: string } | null;
  _count: { recruits: number };
};

type AdminUserListProps = {
  users: UserRow[];
  currentAdminId: string;
};

export function AdminUserList({ users, currentAdminId }: AdminUserListProps) {
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
          className="h-11 rounded-2xl border border-black/10 bg-white px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-2xl border border-black/10 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <Button variant="secondary" onClick={applyFilters}>
          Filter
        </Button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                    {user.preferredDisplayName ?? user.name ?? user.email}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-black/5 text-black/55"
                    }`}
                  >
                    {user.role.toLowerCase()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-black/55">{user.email}</p>
                <div className="flex flex-wrap gap-3 text-xs text-black/40">
                  <span>{user._count.recruits} recruit{user._count.recruits === 1 ? "" : "s"}</span>
                  {user.sponsor && <span>Sponsor: {user.sponsor.name ?? user.sponsor.email}</span>}
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
          <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
            No users match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
