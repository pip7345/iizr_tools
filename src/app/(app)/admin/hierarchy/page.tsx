import { requireAdmin } from "@/lib/auth/user";
import { getRootUsers, getPendingInvitations } from "@/lib/db/users";
import { RecruitTree } from "@/components/hierarchy/recruit-tree";

export const metadata = { title: "Admin: Full Hierarchy" };

export default async function AdminHierarchyPage() {
  await requireAdmin();

  const [rootUsers, pendingInvitations] = await Promise.all([
    getRootUsers(),
    getPendingInvitations(),
  ]);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Full user hierarchy
        </h1>
        <p className="text-base leading-8 text-[hsl(var(--muted-foreground))]">
          Users without sponsors are shown at the root. Expand nodes to see recruits.
        </p>
      </section>

      <div className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
        {rootUsers.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No users in the system.</p>
        ) : (
          <RecruitTree recruits={rootUsers} />
        )}
      </div>

      {pendingInvitations.length > 0 && (
        <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="text-lg font-semibold text-amber-300">
            Pending invitations ({pendingInvitations.length})
          </h2>
          <div className="mt-3 space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-[hsl(var(--card))] px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-amber-300">{inv.name}</span>
                  <span className="ml-2 text-amber-400">{inv.email ?? ""}</span>
                </div>
                <span className="text-xs text-amber-400">
                  Sponsor: {inv.sponsor?.name ?? inv.sponsor?.email ?? ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
