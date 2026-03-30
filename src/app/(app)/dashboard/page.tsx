import Link from "next/link";
import type { Route } from "next";

import { requireUser } from "@/lib/auth/user";
import { getCreditBalance, getCreditBalances, getCreditCategories, getCreditHistoryPage } from "@/lib/db/credits";
import { getRecruitsTree, getUserById, getInvitationsForSponsor } from "@/lib/db/users";
import { UserRole } from "@prisma/client/index";
import { RecruitTree } from "@/components/hierarchy/recruit-tree";
import { ProfileSidebarCard } from "@/components/profile/profile-sidebar-card";
import { PendingInvitationsSection } from "@/components/invitations/pending-invitations-section";

export const metadata = {
  title: "Dashboard",
};

const PAGE_SIZE = 10;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [creditBalance, myRecruits, invitations, userWithSponsor, historyData, categories] =
    await Promise.all([
      getCreditBalance(user.id),
      getRecruitsTree(user.id),
      getInvitationsForSponsor(user.id),
      getUserById(user.id),
      getCreditHistoryPage(user.id, page, PAGE_SIZE),
      getCreditCategories(),
    ]);

  const treeBalances = await getCreditBalances(myRecruits.map((r) => r.id));
  const treeRecruits = myRecruits.map((r) => ({ ...r, creditBalance: treeBalances[r.id] ?? 0 }));

  const sponsor = userWithSponsor?.sponsor ?? null;
  const sponsorInfo = sponsor
    ? { id: sponsor.id, name: sponsor.preferredDisplayName ?? sponsor.name ?? sponsor.email ?? "" }
    : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const referralCodeProp = {
    code: user.referralCode,
    url: `${appUrl}/api/referral?referral=${user.referralCode}`,
  };

  const pendingInvitations = invitations;
  const isAdmin = user.role === UserRole.ADMIN;

  const pendingInvitationProps = pendingInvitations.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    signupCode: i.signupCode,
  }));
  const totalPages = Math.max(1, Math.ceil(historyData.total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Welcome back, {user.preferredDisplayName ?? user.name ?? "there"}.
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT: profile + stats card */}
        <div className="lg:self-start">
          <ProfileSidebarCard
            id={user.id}
            displayName={user.preferredDisplayName ?? user.name ?? user.email ?? ""}
            role={user.role}
            status={user.status}
            bio={user.bio}
            location={user.location}
            joinedAt={user.joinedAt}
            sponsor={sponsorInfo}
            recruitCount={myRecruits.length}
            balance={creditBalance}
            isOwnProfile
            referralCode={referralCodeProp}
            extraStats={[
              {
                label: "Pending invitations",
                value: pendingInvitations.length,
                href: "/invitations",
                accent: pendingInvitations.length > 0,
              },
            ]}
          />
        </div>

        {/* RIGHT: credit history */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Credit history
          </h2>

          {historyData.total === 0 ? (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
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
                        href={`/dashboard?page=${safePage - 1}` as Route}
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
                        href={`/dashboard?page=${safePage + 1}` as Route}
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
          {/* Recruit hierarchy */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
                Recruit hierarchy
              </h2>
            </div>

            {treeRecruits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No recruits yet. Share your referral link to start building your network.
              </div>
            ) : (
              <div className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
                <RecruitTree
                recruits={treeRecruits}
                viewerCurrentUserId={user.id}
                viewerIsAdmin={isAdmin}
                viewerCanNominate
                categories={categories}
              />
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          <PendingInvitationsSection
            invitations={pendingInvitationProps}
            appUrl={appUrl}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
