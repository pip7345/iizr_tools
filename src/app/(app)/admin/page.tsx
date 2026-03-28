import Link from "next/link";

import { requireAdmin } from "@/lib/auth/user";
import { getUserStats } from "@/lib/db/users";
import { getPendingNominations, getAllPendingInvitationCredits } from "@/lib/db/credits";
import { getPendingInvitations } from "@/lib/db/invitations";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  const [stats, pendingNominations, pendingInvCredits, pendingInvitations] = await Promise.all([
    getUserStats(),
    getPendingNominations(),
    getAllPendingInvitationCredits(),
    getPendingInvitations(),
  ]);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Administration
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Admin dashboard
        </h1>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Total users</p>
          <p className="mt-3 text-4xl font-semibold text-[hsl(var(--foreground))]">{stats.totalUsers}</p>
        </article>
        <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Active users</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-400">{stats.activeUsers}</p>
        </article>
        <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Admins</p>
          <p className="mt-3 text-4xl font-semibold text-gradient">{stats.adminUsers}</p>
        </article>
        <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Pending approvals</p>
          <p className="mt-3 text-4xl font-semibold text-amber-400">
            {pendingNominations.length + pendingInvCredits.length}
          </p>
        </article>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">User management</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            View all users, manage roles, reassign sponsors, start impersonation.
          </p>
        </Link>
        <Link
          href="/admin/nominations"
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Credit nominations</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {pendingNominations.length} pending nomination{pendingNominations.length === 1 ? "" : "s"} · {pendingInvCredits.length} pending invitation credit{pendingInvCredits.length === 1 ? "" : "s"}
          </p>
        </Link>
        <Link
          href="/admin/credits"
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Credit management</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Directly create, edit, or delete credit transactions for any user.
          </p>
        </Link>
        <Link
          href="/admin/hierarchy"
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Full hierarchy</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            View the complete sponsor/recruit tree for all users.
          </p>
        </Link>
        <Link
          href="/admin/invitations"
          className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Invitations</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {pendingInvitations.length} pending invitation{pendingInvitations.length === 1 ? "" : "s"} across all sponsors.
          </p>
        </Link>
      </div>
    </div>
  );
}
