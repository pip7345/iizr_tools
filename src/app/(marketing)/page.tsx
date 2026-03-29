import Link from "next/link";
import type { Route } from "next";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { getUserOrNull } from "@/lib/auth/user";
import { getUserStats, getLeaderboardPage } from "@/lib/db/users";

const LEADERBOARD_PAGE_SIZE = 10;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [user, stats, leaderboard] = await Promise.all([
    getUserOrNull(),
    getUserStats(),
    getLeaderboardPage(page, LEADERBOARD_PAGE_SIZE),
  ]);

  const totalPages = Math.max(1, Math.ceil(leaderboard.total / LEADERBOARD_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <main className="relative bg-[hsl(var(--background))]">
      {/* Animated blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-glow-fuchsia animate-blob absolute -left-40 top-0 h-[600px] w-[600px] opacity-40" />
        <div className="bg-glow-blue animate-blob animation-delay-2000 absolute -right-40 top-40 h-[500px] w-[500px] opacity-30" />
        <div className="bg-glow-cyan animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[400px] w-[400px] opacity-25" />
      </div>

      <div className="mx-auto max-w-6xl px-6">

        {/* ── HEADER ─────────────────────────────────────── */}
        <header className="flex items-center justify-between py-5 border-b border-[hsl(var(--border))/0.4]">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))] leading-tight">
                Referral &amp; Credits Platform
              </p>
              <span className="text-lg font-semibold text-gradient leading-tight">
                iiZR Tools
              </span>
            </div>
            <a
              href="https://iizr.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M10 2L2 10M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              iizr.app
            </a>
          </div>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="secondary" className="h-9 text-sm">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" className="h-9 text-sm">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="h-9 text-sm">Get started</Button>
                </SignUpButton>
              </>
            )}
          </nav>
        </header>

        {/* ── HERO ───────────────────────────────────────── */}
        <section className="py-14 text-center">
          <p className="inline-flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))] shadow-sm backdrop-blur mb-6">
            Sponsor · Recruit · Earn
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.06] tracking-tight text-[hsl(var(--foreground))] max-w-2xl mx-auto mb-5">
            Build your network,<br className="hidden sm:block" /> earn credits, grow{" "}
            <span className="text-gradient">together.</span>
          </h2>
          <p className="text-base text-[hsl(var(--muted-foreground))] max-w-lg mx-auto leading-8 mb-8">
            A private referral and credits platform. Invite members, nominate credits for your recruits, and track your network — all in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <button className="btn-gradient inline-flex h-11 items-center justify-center rounded-full px-8 text-sm font-medium text-white shadow-lg">
                  Go to dashboard
                </button>
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="btn-gradient inline-flex h-11 items-center justify-center rounded-full px-8 text-sm font-medium text-white shadow-lg">
                    Get started free
                  </button>
                </SignUpButton>
                <a
                  href="#leaderboard"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card-hover))] transition"
                >
                  View leaderboard ↓
                </a>
              </>
            )}
          </div>
        </section>

        {/* ── STATS BAR ──────────────────────────────────── */}
        <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Platform statistics">
          <StatCard label="Total members" value={stats.totalUsers.toLocaleString()} />
          <StatCard label="Active" value={stats.activeUsers.toLocaleString()} color="emerald" />
          <StatCard label="Referred in" value={stats.referredUsers.toLocaleString()} color="blue" />
          <StatCard label="Credits issued" value={stats.totalCreditsIssued.toLocaleString()} color="purple" />
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────── */}
        <section className="mb-14">
          <p className="text-center text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] mb-6">
            How it works
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <HowStep
              step="01"
              title="Get invited & sign up"
              body="Join through a referral link from an existing member, or request access. All accounts are sponsored."
            />
            <HowStep
              step="02"
              title="Refer others & grow"
              body="Generate referral codes, send invitations, and build your own recruit network under your sponsorship."
            />
            <HowStep
              step="03"
              title="Earn & use credits"
              body="Sponsors nominate credits for recruits and admins approve them. Earn recognition and community perks."
            />
          </div>
        </section>

        {/* ── LEADERBOARD ────────────────────────────────── */}
        <section id="leaderboard" className="mb-20 scroll-mt-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] mb-1">Community</p>
              <h3 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">Leaderboard</h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Members ranked by total credits earned, then by recruits referred.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              {leaderboard.total.toLocaleString()} members
            </span>
          </div>

          {leaderboard.entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No members yet — be the first to join.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] card-gradient shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3]">
                    <th className="w-16 px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Rank</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Member</th>
                    <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Credits</th>
                    <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Referrals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {leaderboard.entries.map((entry, i) => {
                    const rank = (safePage - 1) * LEADERBOARD_PAGE_SIZE + i + 1;
                    const isGold = rank === 1;
                    const isSilver = rank === 2;
                    const isBronze = rank === 3;
                    const rankColor = isGold
                      ? "text-yellow-400"
                      : isSilver
                        ? "text-slate-300"
                        : isBronze
                          ? "text-amber-500"
                          : "text-[hsl(var(--muted-foreground))]";
                    const rowBg = isGold
                      ? "bg-yellow-500/[0.04]"
                      : isSilver
                        ? "bg-slate-500/[0.04]"
                        : isBronze
                          ? "bg-amber-500/[0.04]"
                          : "";
                    return (
                      <tr key={entry.id} className={`hover:bg-[hsl(var(--muted))/0.3] transition ${rowBg}`}>
                        <td className="w-16 px-5 py-4">
                          <span className={`text-sm font-bold tabular-nums ${rankColor}`}>#{rank}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/users/${entry.id}` as Route}
                            className="font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:underline transition"
                          >
                            {entry.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold tabular-nums text-emerald-400">
                          {entry.credits >= 0 ? "+" : ""}{entry.credits.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right font-mono tabular-nums text-[hsl(var(--muted-foreground))]">
                          {entry.referrals.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">
                Page {safePage} of {totalPages} &middot; {leaderboard.total.toLocaleString()} members
              </span>
              <div className="flex gap-2">
                {safePage > 1 ? (
                  <a
                    href={`/?page=${safePage - 1}#leaderboard`}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 font-medium shadow-sm hover:bg-[hsl(var(--card-hover))] transition"
                  >
                    ← Previous
                  </a>
                ) : (
                  <span className="rounded-lg border border-[hsl(var(--border))/0.4] px-4 py-1.5 text-[hsl(var(--muted-foreground))/0.4] select-none">← Previous</span>
                )}
                {safePage < totalPages ? (
                  <a
                    href={`/?page=${safePage + 1}#leaderboard`}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 font-medium shadow-sm hover:bg-[hsl(var(--card-hover))] transition"
                  >
                    Next →
                  </a>
                ) : (
                  <span className="rounded-lg border border-[hsl(var(--border))/0.4] px-4 py-1.5 text-[hsl(var(--muted-foreground))/0.4] select-none">Next →</span>
                )}
              </div>
            </div>
          )}

          {/* Join CTA inside leaderboard for unauthenticated visitors */}
          {!user && (
            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[hsl(var(--primary))/0.25] bg-[hsl(var(--primary))/0.06] px-6 py-4">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">Want to appear on this leaderboard?</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Create an account, build your network, and start earning credits.</p>
              </div>
              <SignUpButton mode="modal">
                <button className="btn-gradient inline-flex h-9 shrink-0 items-center justify-center rounded-full px-6 text-xs font-medium text-white shadow-md">
                  Join now →
                </button>
              </SignUpButton>
            </div>
          )}
        </section>

        {/* ── BOTTOM CTA ─────────────────────────────────── */}
        {!user && (
          <section className="mb-16 overflow-hidden rounded-2xl border border-[hsl(var(--border))] card-gradient px-10 py-12 text-center shadow-lg relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))/0.07] to-transparent" />
            <h3 className="relative text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] mb-3">
              Ready to start building?
            </h3>
            <p className="relative text-sm text-[hsl(var(--muted-foreground))] mb-7 max-w-sm mx-auto leading-6">
              Join the private community, grow your network, and start climbing the leaderboard.
            </p>
            <SignUpButton mode="modal">
              <button className="btn-gradient relative inline-flex h-11 items-center justify-center rounded-full px-10 text-sm font-medium text-white shadow-lg">
                Create your free account
              </button>
            </SignUpButton>
          </section>
        )}

        {/* ── FOOTER ─────────────────────────────────────── */}
        <footer className="border-t border-[hsl(var(--border))/0.4] py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} iiZR Tools · Private platform
          </p>
          <div className="flex items-center gap-5 text-xs text-[hsl(var(--muted-foreground))]">
            <a
              href="https://iizr.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(var(--foreground))] transition inline-flex items-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M10 2L2 10M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              iizr.app
            </a>
            <span className="opacity-30">·</span>
            <span>Part of the iizr.app ecosystem</span>
          </div>
        </footer>

      </div>
    </main>
  );
}

// ── Presentational helpers ──────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "emerald" | "blue" | "purple";
}) {
  const numColor =
    color === "emerald"
      ? "text-emerald-400"
      : color === "blue"
        ? "text-blue-400"
        : color === "purple"
          ? "text-gradient"
          : "text-[hsl(var(--foreground))]";
  return (
    <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))] mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${numColor}`}>{value}</p>
    </article>
  );
}

function HowStep({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
      <p className="text-[11px] font-mono font-bold text-[hsl(var(--primary))] mb-3">{step}</p>
      <p className="font-semibold text-[hsl(var(--foreground))] mb-2">{title}</p>
      <p className="text-sm text-[hsl(var(--muted-foreground))] leading-6">{body}</p>
    </div>
  );
}

