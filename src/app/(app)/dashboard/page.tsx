import Link from "next/link";

import { requireUser } from "@/lib/auth/user";
import { getCreditBalance } from "@/lib/db/credits";
import { getRecruitsTree } from "@/lib/db/users";
import { getReferralCodesForUser } from "@/lib/db/referral-codes";
import { getInvitationsForSponsor } from "@/lib/db/invitations";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [creditBalance, recruits, referralCodes, invitations] = await Promise.all([
    getCreditBalance(user.id),
    getRecruitsTree(user.id),
    getReferralCodesForUser(user.id),
    getInvitationsForSponsor(user.id),
  ]);

  const pendingInvitations = invitations.filter((i) => i.status === "PENDING");

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Dashboard
        </p>
        <div className="space-y-3">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Welcome back, {user.preferredDisplayName ?? user.name ?? "there"}.
          </h1>
          {user.sponsorId ? (
            <p className="text-base leading-8 text-black/65">
              You are sponsored. Manage your referrals, invitations, and credits below.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-base leading-8 text-black/65">
                You do not have a sponsor yet.
              </p>
              <Link href="/sponsor">
                <Button variant="secondary">Assign sponsor</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Credit balance</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-sage)]">{creditBalance}</p>
          <Link href="/credits" className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
            View history →
          </Link>
        </article>
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Direct recruits</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">{recruits.length}</p>
          <Link href="/recruits" className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
            View hierarchy →
          </Link>
        </article>
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Referral codes</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">{referralCodes.length}</p>
          <Link href="/referrals" className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
            Manage →
          </Link>
        </article>
        <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-black/40">Pending invitations</p>
          <p className="mt-3 text-4xl font-semibold text-[var(--color-accent)]">{pendingInvitations.length}</p>
          <Link href="/invitations" className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
            Manage →
          </Link>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-black/50">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/50">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            {user.preferredDisplayName && (
              <div className="flex justify-between">
                <dt className="text-black/50">Display name</dt>
                <dd className="font-medium">{user.preferredDisplayName}</dd>
              </div>
            )}
            {user.bio && (
              <div className="flex justify-between">
                <dt className="text-black/50">Bio</dt>
                <dd className="max-w-xs text-right font-medium">{user.bio}</dd>
              </div>
            )}
            {user.location && (
              <div className="flex justify-between">
                <dt className="text-black/50">Location</dt>
                <dd className="font-medium">{user.location}</dd>
              </div>
            )}
          </dl>
          <Link href="/profile" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
            Edit profile →
          </Link>
        </section>

        {recruits.length > 0 && (
          <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Recent recruits</h2>
            <ul className="mt-4 space-y-3">
              {recruits.slice(0, 5).map((recruit) => (
                <li key={recruit.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{recruit.name ?? recruit.email}</span>
                  <span className="rounded-full bg-black/5 px-2 py-1 text-xs text-black/55">
                    {recruit._count.recruits} recruit{recruit._count.recruits === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/recruits" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline">
              View all →
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
