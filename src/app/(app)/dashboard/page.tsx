import { ProjectForm } from "@/components/dashboard/project-form";
import { ProjectList } from "@/components/dashboard/project-list";
import { requireUser } from "@/lib/auth/user";
import { getProjectsForUser } from "@/lib/db/projects";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await getProjectsForUser(user.id);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Authenticated area
        </p>
        <div className="space-y-3">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Welcome back, {user.name ?? "there"}.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-black/65">
            This route is protected by Clerk middleware, the dashboard layout, and each individual Server Action.
            The project form writes directly to PostgreSQL through Prisma without a REST layer.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <ProjectForm />
        <ProjectList projects={projects} />
      </div>
    </div>
  );
}
