import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { getRealUser, requireUser } from "@/lib/auth/user";
import { getUserPublicProfile, getRecruitsTree } from "@/lib/db/users";
import { getCreditBalance, getCreditBalances, getCreditHistoryPage } from "@/lib/db/credits";
import { ImpersonateButton } from "@/components/profile/impersonate-button";
import { RecruitTree } from "@/components/hierarchy/recruit-tree";

const PAGE_SIZE = 10;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserPublicProfile(id);
  if (!user) return { title: "User not found" };
  const displayName = user.preferredDisplayName ?? user.name ?? "Unknown user";
  return { title: displayName };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [currentUser, realUser] = await Promise.all([requireUser(), getRealUser()]);
  const { id } = await params;
  const sp = await searchParams;

  const [user, balance, recruits] = await Promise.all([
    getUserPublicProfile(id),
    getCreditBalance(id),
    getRecruitsTree(id),
  ]);

  if (!user) notFound();

  const recruitBalances = await getCreditBalances(recruits.map((r) => r.id));
  const enrichedRecruits = recruits.map((r) => ({
    ...r,
    creditBalance: recruitBalances[r.id] ?? 0,
  }));

  const canViewHistory = currentUser.id === id;
  // Show nominate button when the viewer sponsors these recruits (own profile) or is an admin above everyone
  const viewerCanNominate = currentUser.id === id || realUser.role === "ADMIN";
  const canImpersonate = realUser.role === "ADMIN" && realUser.id !== id;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const historyData = canViewHistory
    ? await getCreditHistoryPage(id, page, PAGE_SIZE)
    : null;

  const totalPages = historyData ? Math.max(1, Math.ceil(historyData.total / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, totalPages);

  const displayName = user.preferredDisplayName ?? user.name ?? "Unknown user";
  const sponsorName = user.sponsor
    ? (user.sponsor.preferredDisplayName ?? user.sponsor.name ?? user.sponsor.email)
    : null;

  return (
    <div className="grid gap-8">
      {/* Header */}
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(237,246,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Profile
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
            {displayName}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              user.role === "ADMIN"
                ? "bg-purple-100 text-purple-700"
                : "bg-black/5 text-black/55"
            }`}
          >
            {user.role.toLowerCase()}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              user.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {user.status.toLowerCase()}
          </span>
          {canImpersonate && (
            <div className="ml-auto">
              <ImpersonateButton userId={id} />
            </div>
          )}
        </div>
        {user.bio && (
          <p className="max-w-xl text-base leading-7 text-black/65">{user.bio}</p>
        )}
      </section>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Credit score — always visible */}
        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-black/35">
            Credit score
          </p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${balance >= 0 ? "text-[var(--color-sage,#4ade80)]" : "text-red-600"}`}>
            {balance >= 0 ? "+" : ""}{balance.toLocaleString()}
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-black/35">
            Recruits
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">
            {user._count.recruits}
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-black/35">
            Member since
          </p>
          <p className="mt-1 text-base font-medium text-[var(--color-foreground)]">
            {user.joinedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-black/35">
            Sponsor
          </p>
          {user.sponsor ? (
            <Link
              href={`/users/${user.sponsor.id}` as Route}
              className="mt-1 block text-base font-medium text-[var(--color-accent)] hover:underline"
            >
              {sponsorName}
            </Link>
          ) : (
            <p className="mt-1 text-base text-black/40">No sponsor</p>
          )}
        </div>

        {user.location && (
          <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-widest text-black/35">
              Location
            </p>
            <p className="mt-1 text-base font-medium text-[var(--color-foreground)]">
              {user.location}
            </p>
          </div>
        )}
      </div>

      {/* Bio — shown as a standalone card when present */}
      {user.bio && (
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-black/35">
            About
          </p>
          <p className="mt-2 text-base leading-7 text-black/70">{user.bio}</p>
        </div>
      )}

      {/* Recruit tree */}
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Recruit hierarchy
        </h2>
        {recruits.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
            {displayName} has no recruits yet.
          </div>
        ) : (
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <RecruitTree recruits={enrichedRecruits} viewerCanNominate={viewerCanNominate} />
          </div>
        )}
      </section>

      {/* Credit history */}
      {canViewHistory && historyData && (
        <section className="grid gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
            Credit history
          </h2>

          {historyData.total === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
              No credit transactions yet.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/8 bg-black/[0.02]">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-black/40">
                        Date
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-black/40">
                        Description
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-black/40">
                        By
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-black/40">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {historyData.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-black/[0.015]">
                        <td className="whitespace-nowrap px-5 py-3.5 text-black/50">
                          {tx.createdAt.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--color-foreground)]">
                          {tx.description}
                        </td>
                        <td className="px-5 py-3.5 text-black/50">
                          {tx.nominator ? (
                            <Link
                              href={`/users/${tx.nominator.id}` as Route}
                              className="hover:text-[var(--color-accent)] hover:underline"
                            >
                              {tx.nominator.name ?? "—"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3.5 text-right font-mono font-semibold tabular-nums ${
                            tx.amount >= 0 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/45">
                    Page {safePage} of {totalPages} &middot; {historyData.total} transaction{historyData.total === 1 ? "" : "s"}
                  </span>
                  <div className="flex gap-2">
                    {safePage > 1 ? (
                      <Link
                        href={`/users/${id}?page=${safePage - 1}` as Route}
                        className="rounded-xl border border-black/10 bg-white px-4 py-1.5 font-medium text-[var(--color-foreground)] shadow-sm hover:border-black/20"
                      >
                        ← Previous
                      </Link>
                    ) : (
                      <span className="rounded-xl border border-black/5 px-4 py-1.5 text-black/25">
                        ← Previous
                      </span>
                    )}
                    {safePage < totalPages ? (
                      <Link
                        href={`/users/${id}?page=${safePage + 1}` as Route}
                        className="rounded-xl border border-black/10 bg-white px-4 py-1.5 font-medium text-[var(--color-foreground)] shadow-sm hover:border-black/20"
                      >
                        Next →
                      </Link>
                    ) : (
                      <span className="rounded-xl border border-black/5 px-4 py-1.5 text-black/25">
                        Next →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

