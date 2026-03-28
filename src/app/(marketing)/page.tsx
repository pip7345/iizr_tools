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
    <main className="relative overflow-hidden bg-[hsl(var(--background))]">
      {/* Animated blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-glow-fuchsia animate-blob absolute -left-40 top-0 h-[600px] w-[600px] opacity-40" />
        <div className="bg-glow-blue animate-blob animation-delay-2000 absolute -right-40 top-40 h-[500px] w-[500px] opacity-30" />
        <div className="bg-glow-cyan animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[400px] w-[400px] opacity-25" />
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))]">
              Referral &amp; Credits Platform
            </p>
            <h1 className="text-xl font-semibold text-gradient">
              iiZR Tools
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
              <p className="inline-flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))] shadow-sm backdrop-blur">
                Sponsor · Recruit · Earn
              </p>
              <h2 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[hsl(var(--foreground))] sm:text-6xl">
                Build your network, earn credits, grow together.
              </h2>
              <p className="max-w-2xl text-lg leading-9 text-[hsl(var(--muted-foreground))]">
                Create referral links, invite new members, nominate credits for your recruits, and track your network hierarchy — all in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="btn-gradient inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-medium text-white shadow-lg transition hover:opacity-90"
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
              <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Total users</p>
                <p className="mt-3 text-4xl font-semibold text-[hsl(var(--foreground))]">
                  {stats.totalUsers}
                </p>
              </article>
              <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Active</p>
                <p className="mt-3 text-4xl font-semibold text-emerald-400">
                  {stats.activeUsers}
                </p>
              </article>
              <article className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Administrators</p>
                <p className="mt-3 text-4xl font-semibold text-gradient">
                  {stats.adminUsers}
                </p>
              </article>
            </div>
          </div>

          <aside className="rounded-lg border border-[hsl(var(--border))] card-gradient p-8 shadow-lg backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
              {user ? "Your account" : "How it works"}
            </p>

            {user ? (
              <div className="mt-6 space-y-4 text-sm text-[hsl(var(--foreground))]">
                <p>
                  Welcome back, <strong>{user.name}</strong>. Head to your dashboard to manage referrals, credits, and invitations.
                </p>
                <Link href="/dashboard">
                  <Button className="w-full">Go to dashboard</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
                <div className="space-y-3">
                  <div className="rounded-lg border border-[hsl(var(--border))/0.5] bg-[hsl(var(--muted))/0.3] px-4 py-3">
                    <p className="font-medium text-[hsl(var(--foreground))]">1. Sign up</p>
                    <p className="text-[hsl(var(--muted-foreground))]">Create your account — optionally through a referral link.</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--border))/0.5] bg-[hsl(var(--muted))/0.3] px-4 py-3">
                    <p className="font-medium text-[hsl(var(--foreground))]">2. Refer others</p>
                    <p className="text-[hsl(var(--muted-foreground))]">Generate referral codes and invite people to join your network.</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--border))/0.5] bg-[hsl(var(--muted))/0.3] px-4 py-3">
                    <p className="font-medium text-[hsl(var(--foreground))]">3. Earn credits</p>
                    <p className="text-[hsl(var(--muted-foreground))]">Sponsors nominate credits for recruits. Admins approve them.</p>
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
