import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

import { getRealUser, requireUser } from "@/lib/auth/user";
import { getUserPublicProfile, getRecruitsTree } from "@/lib/db/users";
import { getCreditBalance, getCreditBalances, getCreditCategories, getCreditHistoryPage } from "@/lib/db/credits";
import { ProfileSidebarCard } from "@/components/profile/profile-sidebar-card";
import { RecruitTree } from "@/components/hierarchy/recruit-tree";
import { AdminCreditHistorySection } from "@/components/admin/admin-user-credit-controls";

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

  const [user, balance, recruits, categories] = await Promise.all([
    getUserPublicProfile(id),
    getCreditBalance(id),
    getRecruitsTree(id),
    getCreditCategories(),
  ]);

  if (!user) notFound();

  const recruitBalances = await getCreditBalances(recruits.map((r) => r.id));
  const enrichedRecruits = recruits.map((r) => ({
    ...r,
    creditBalance: recruitBalances[r.id] ?? 0,
  }));

  const isAdmin = realUser.role === "ADMIN";
  const canViewHistory = currentUser.id === id || isAdmin;
  // Show nominate button when the viewer sponsors these recruits (own profile) or is an admin above everyone
  const viewerCanNominate = currentUser.id === id || isAdmin;
  const canImpersonate = isAdmin && realUser.id !== id;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const historyData = canViewHistory
    ? await getCreditHistoryPage(id, page, PAGE_SIZE)
    : null;

  const totalPages = historyData ? Math.max(1, Math.ceil(historyData.total / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, totalPages);

  const displayName = user.preferredDisplayName ?? user.name ?? "Unknown user";

  const sponsorInfo = user.sponsor
    ? {
        id: user.sponsor.id,
        name: user.sponsor.preferredDisplayName ?? user.sponsor.name ?? user.sponsor.email ?? "",
      }
    : null;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Profile</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          {displayName}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT: profile + stats card */}
        <div className="lg:self-start">
          <ProfileSidebarCard
            id={id}
            displayName={displayName}
            role={user.role}
            status={user.status}
            bio={user.bio}
            location={user.location}
            joinedAt={user.joinedAt}
            sponsor={sponsorInfo}
            recruitCount={user._count.recruits}
            balance={balance}
            isOwnProfile={canViewHistory}
            canImpersonate={canImpersonate}
          />
        </div>

        {/* RIGHT: credit history + recruit tree */}
        <div className="flex flex-col gap-6">
          {canViewHistory && historyData && (
            isAdmin ? (
              <AdminCreditHistorySection
                userId={id}
                transactions={historyData.transactions.map((tx) => ({
                  id: tx.id,
                  createdAt: tx.createdAt.toISOString(),
                  description: tx.description,
                  amount: tx.amount,
                  nominator: tx.nominator,
                  isLinked: tx.status === "PENDING",
                }))}
                total={historyData.total}
                page={safePage}
                totalPages={totalPages}
              />
            ) : (
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
                  Credit history
                </h2>

                {historyData.total === 0 ? (
                  <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No credit transactions yet.
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] card-gradient shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3]">
                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                              Date
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                              Description
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                              By
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[hsl(var(--border))]">
                          {historyData.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-[hsl(var(--muted))/0.3]">
                              <td className="whitespace-nowrap px-5 py-3.5 text-[hsl(var(--muted-foreground))]">
                                {tx.createdAt.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td className="px-5 py-3.5 text-[hsl(var(--foreground))]">
                                {tx.description}
                              </td>
                              <td className="px-5 py-3.5 text-[hsl(var(--muted-foreground))]">
                                {tx.nominator ? (
                                  <Link
                                    href={`/users/${tx.nominator.id}` as Route}
                                    className="hover:text-[hsl(var(--primary))] hover:underline"
                                  >
                                    {tx.nominator.name ?? "—"}
                                  </Link>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td
                                className={`whitespace-nowrap px-5 py-3.5 text-right font-mono font-semibold tabular-nums ${
                                  tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
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

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Page {safePage} of {totalPages} &middot;{" "}
                          {historyData.total} transaction
                          {historyData.total === 1 ? "" : "s"}
                        </span>
                        <div className="flex gap-2">
                          {safePage > 1 ? (
                            <Link
                              href={`/users/${id}?page=${safePage - 1}` as Route}
                              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 font-medium shadow-sm hover:border-[hsl(var(--border))]"
                            >
                              ← Previous
                            </Link>
                          ) : (
                            <span className="rounded-lg border border-[hsl(var(--border))/0.5] px-4 py-1.5 text-[hsl(var(--muted-foreground))/0.5]">
                              ← Previous
                            </span>
                          )}
                          {safePage < totalPages ? (
                            <Link
                              href={`/users/${id}?page=${safePage + 1}` as Route}
                              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 font-medium shadow-sm hover:border-[hsl(var(--border))]"
                            >
                              Next →
                            </Link>
                          ) : (
                            <span className="rounded-lg border border-[hsl(var(--border))/0.5] px-4 py-1.5 text-[hsl(var(--muted-foreground))/0.5]">
                              Next →
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )
          )}

          {/* Recruit tree */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Recruit hierarchy
            </h2>
            {recruits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                {displayName} has no recruits yet.
              </div>
            ) : (
              <div className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
                <RecruitTree
                recruits={enrichedRecruits}
                viewerCurrentUserId={currentUser.id}
                viewerIsAdmin={isAdmin}
                viewerCanNominate={viewerCanNominate}
                categories={categories}
              />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

