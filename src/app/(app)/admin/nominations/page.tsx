import { requireAdmin } from "@/lib/auth/user";
import { getPendingNominations } from "@/lib/db/credits";
import { NominationApprovalList } from "@/components/admin/nomination-approval-list";

export const metadata = { title: "Admin: Nominations" };

export default async function AdminNominationsPage() {
  await requireAdmin();

  const nominations = await getPendingNominations();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Credit nominations
        </h1>
      </section>

      <div className="grid gap-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[hsl(var(--foreground))]">
            Pending nominations ({nominations.length})
          </h2>
          <NominationApprovalList nominations={nominations} />
        </section>
      </div>
    </div>
  );
}
