import type { Project } from "@prisma/client/index";

import {
  deleteProjectAction,
  toggleProjectArchivedAction,
} from "@/actions/project-actions";
import { Button } from "@/components/ui/button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-sm text-black/60 backdrop-blur">
        No projects yet. Create one above to verify Prisma, Clerk, and Server Actions are wired correctly.
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {projects.map((project) => {
        const toggleAction = toggleProjectArchivedAction.bind(null, project.id);
        const deleteAction = deleteProjectAction.bind(null, project.id);

        return (
          <article
            key={project.id}
            className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
                    {project.name}
                  </h3>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-black/55">
                    {project.status.toLowerCase()}
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-7 text-black/65">
                  {project.description || "No description provided."}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-black/35">
                  Created {formatDate(project.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <form action={toggleAction}>
                  <Button type="submit" variant="secondary">
                    {project.status === "ACTIVE" ? "Archive" : "Restore"}
                  </Button>
                </form>
                <form action={deleteAction}>
                  <Button type="submit" variant="danger">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
