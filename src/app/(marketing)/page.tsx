import Link from "next/link";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

const highlights = [
  "App Router + Server Components by default",
  "Server Actions with per-action auth checks",
  "Prisma on PostgreSQL for a tight data layer",
  "Clerk auth with protected dashboard routes",
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top,_rgba(212,86,39,0.28),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(10,84,74,0.18),_transparent_24%),linear-gradient(180deg,#fdf8f3_0%,#f5efe8_45%,#f3ede7_100%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/40">
              Next.js production starter
            </p>
            <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
              iizr_tools
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get started</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button variant="secondary">Dashboard</Button>
              </Link>
              <UserButton />
            </Show>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-black/45 shadow-sm backdrop-blur">
                Minimal, typed, production-ready
              </p>
              <h2 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--color-foreground)] sm:text-6xl">
                A clean full-stack starting point for shipping authenticated product workflows fast.
              </h2>
              <p className="max-w-2xl text-lg leading-9 text-black/65">
                This scaffold keeps the stack small: App Router, Prisma, PostgreSQL, Clerk, Tailwind, Zod, and Server Actions.
                It is intentionally thin, so teams can extend it without fighting framework boilerplate.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-7 text-sm font-medium text-white shadow-[0_10px_30px_rgba(212,86,39,0.28)] transition hover:bg-[var(--color-accent-strong)]"
              >
                Open dashboard
              </Link>
              <a href="https://vercel.com/new" target="_blank" rel="noreferrer">
                <Button variant="secondary" className="px-7">
                  Deploy on Vercel
                </Button>
              </a>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/60 bg-white/75 p-8 shadow-[0_25px_120px_rgba(15,23,42,0.12)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Included</p>
            <ul className="mt-6 grid gap-4 text-sm text-black/70">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-black/7 bg-white px-4 py-4 leading-7 shadow-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
