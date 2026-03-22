import Link from "next/link";

import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { getUserOrNull } from "@/lib/auth/user";
import { getUserStats } from "@/lib/db/users";

export default async function HomePage() {
  const user = await getUserOrNull();
  const stats = await getUserStats();

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top,_rgba(212,86,39,0.28),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(10,84,74,0.18),_transparent_24%),linear-gradient(180deg,#fdf8f3_0%,#f5efe8_45%,#f3ede7_100%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/40">
              Referral &amp; Credits Platform
            </p>
            <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
              iizr_tools
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="secondary">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get started</Button>
              </SignUpButton>
              </>
            )}
          </div>
        </header>

        <div className="grid flex-1 gap-12 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
          <div className="space-y-10">
            <div className="space-y-5">
              <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-black/45 shadow-sm backdrop-blur">
                Sponsor · Recruit · Earn
              </p>
              <h2 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--color-foreground)] sm:text-6xl">
                Build your network, earn credits, grow together.
              </h2>
              <p className="max-w-2xl text-lg leading-9 text-black/65">
                Create referral links, invite new members, nominate credits for your recruits, and track your network hierarchy — all in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-7 text-sm font-medium text-white shadow-[0_10px_30px_rgba(212,86,39,0.28)] transition hover:bg-[var(--color-accent-strong)]"
              >
                Open dashboard
              </Link>
              <Link href="/#platform-stats">
                <Button variant="secondary" className="px-7">
                  View platform stats
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3" id="platform-stats">
              <article className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-black/40">Total users</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
                  {stats.totalUsers}
                </p>
              </article>
              <article className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-black/40">Active</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--color-sage)]">
                  {stats.activeUsers}
                </p>
              </article>
              <article className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-black/40">Administrators</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--color-accent)]">
                  {stats.adminUsers}
                </p>
              </article>
            </div>
          </div>

          <aside className="rounded-[2.5rem] border border-white/60 bg-white/75 p-8 shadow-[0_25px_120px_rgba(15,23,42,0.12)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">
              {user ? "Your account" : "How it works"}
            </p>

            {user ? (
              <div className="mt-6 space-y-4 text-sm text-black/70">
                <p>
                  Welcome back, <strong>{user.name}</strong>. Head to your dashboard to manage referrals, credits, and invitations.
                </p>
                <Link href="/dashboard">
                  <Button className="w-full">Go to dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4 text-sm leading-7 text-black/65">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-black/5 bg-black/2 px-4 py-3">
                    <p className="font-medium text-[var(--color-foreground)]">1. Sign up</p>
                    <p className="text-black/55">Create your account — optionally through a referral link.</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-black/2 px-4 py-3">
                    <p className="font-medium text-[var(--color-foreground)]">2. Refer others</p>
                    <p className="text-black/55">Generate referral codes and invite people to join your network.</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-black/2 px-4 py-3">
                    <p className="font-medium text-[var(--color-foreground)]">3. Earn credits</p>
                    <p className="text-black/55">Sponsors nominate credits for recruits. Admins approve them.</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
