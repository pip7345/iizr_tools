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
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Administration
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Admin dashboard
        </h1>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Total users</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">{stats.totalUsers}</p>
        </article>
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Active users</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-sage)]">{stats.activeUsers}</p>
        </article>
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Admins</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-accent)]">{stats.adminUsers}</p>
        </article>
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Pending approvals</p>
          <p className="mt-3 text-4xl font-semibold text-amber-600">
            {pendingNominations.length + pendingInvCredits.length}
          </p>
        </article>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">User management</h2>
          <p className="mt-2 text-sm text-black/55">
            View all users, manage roles, reassign sponsors, start impersonation.
          </p>
        </Link>
        <Link
          href="/admin/nominations"
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Credit nominations</h2>
          <p className="mt-2 text-sm text-black/55">
            {pendingNominations.length} pending nomination{pendingNominations.length === 1 ? "" : "s"} · {pendingInvCredits.length} pending invitation credit{pendingInvCredits.length === 1 ? "" : "s"}
          </p>
        </Link>
        <Link
          href="/admin/credits"
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Credit management</h2>
          <p className="mt-2 text-sm text-black/55">
            Directly create, edit, or delete credit transactions for any user.
          </p>
        </Link>
        <Link
          href="/admin/hierarchy"
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Full hierarchy</h2>
          <p className="mt-2 text-sm text-black/55">
            View the complete sponsor/recruit tree for all users.
          </p>
        </Link>
        <Link
          href="/admin/invitations"
          className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Invitations</h2>
          <p className="mt-2 text-sm text-black/55">
            {pendingInvitations.length} pending invitation{pendingInvitations.length === 1 ? "" : "s"} across all sponsors.
          </p>
        </Link>
      </div>
    </div>
  );
}
