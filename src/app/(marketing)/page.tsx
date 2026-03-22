import Link from "next/link";
import type { Project } from "@prisma/client/index";

import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { getUserOrNull } from "@/lib/auth/user";
import {
  getProjectLandingStats,
  getRecentProjectsForUser,
} from "@/lib/db/projects";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function HomePage() {
  const user = await getUserOrNull();
  const stats = await getProjectLandingStats();
  const recentProjects = user ? await getRecentProjectsForUser(user.id, 4) : [];

  const featuredProject = recentProjects[0];

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(circle_at_top,_rgba(212,86,39,0.28),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(10,84,74,0.18),_transparent_24%),linear-gradient(180deg,#fdf8f3_0%,#f5efe8_45%,#f3ede7_100%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/40">
              Live demo workspace
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
                Server-rendered from PostgreSQL
              </p>
              <h2 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--color-foreground)] sm:text-6xl">
                The landing page now opens the project demo and reads live database data.
              </h2>
              <p className="max-w-2xl text-lg leading-9 text-black/65">
                This route is an App Router Server Component, so it can query Prisma directly.
                You can verify database access on the public landing page without removing the protected dashboard flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-7 text-sm font-medium text-white shadow-[0_10px_30px_rgba(212,86,39,0.28)] transition hover:bg-[var(--color-accent-strong)]"
              >
                Open demo dashboard
              </Link>
              <Link href="/#database-status">
                <Button variant="secondary" className="px-7">
                  View database status
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3" id="database-status">
              <article className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-black/40">Total projects</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--color-foreground)]">
                  {stats.totalProjects}
                </p>
              </article>
              <article className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-black/40">Active</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--color-sage)]">
                  {stats.activeProjects}
                </p>
              </article>
              <article className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-black/40">Archived</p>
                <p className="mt-3 text-4xl font-semibold text-[var(--color-accent)]">
                  {stats.archivedProjects}
                </p>
              </article>
            </div>

            {user && featuredProject ? (
              <section className="rounded-[2.5rem] border border-white/70 bg-white/78 p-8 shadow-[0_25px_120px_rgba(15,23,42,0.12)] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.26em] text-black/40">
                  Latest demo project
                </p>
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
                      {featuredProject.name}
                    </h3>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-black/55">
                      {featuredProject.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="max-w-2xl text-base leading-8 text-black/65">
                    {featuredProject.description || "No description provided yet for this project."}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-black/35">
                    Created {formatDate(featuredProject.createdAt)}
                  </p>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="rounded-[2.5rem] border border-white/60 bg-white/75 p-8 shadow-[0_25px_120px_rgba(15,23,42,0.12)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">
              {user ? "Your recent projects" : "Demo access"}
            </p>

            {user ? (
              recentProjects.length > 0 ? (
                <div className="mt-6 grid gap-4 text-sm text-black/70">
                  {recentProjects.map((project: Project) => (
                    <article
                      key={project.id}
                      className="rounded-2xl border border-black/7 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                          {project.name}
                        </h3>
                        <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-black/55">
                          {project.status.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-3 leading-7 text-black/65">
                        {project.description || "No description provided."}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-black/35">
                        Created {formatDate(project.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-black/12 bg-white/60 px-4 py-5 text-sm leading-7 text-black/60">
                  Your account is connected, but you do not have any projects yet. Create one from the dashboard and it will appear here on the landing page.
                </div>
              )
            ) : (
              <div className="mt-6 space-y-4 text-sm leading-7 text-black/65">
                <p>
                  Database reads are active on this page now. The counters above come from Prisma on the server.
                </p>
                <p>
                  Sign in to load your own project list here while keeping writes and full CRUD protected inside the dashboard.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
