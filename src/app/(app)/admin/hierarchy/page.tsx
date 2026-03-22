import { requireAdmin } from "@/lib/auth/user";
import { getRootUsers } from "@/lib/db/users";
import { getPendingInvitations } from "@/lib/db/invitations";
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
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Full user hierarchy
        </h1>
        <p className="text-base leading-8 text-black/65">
          Users without sponsors are shown at the root. Expand nodes to see recruits.
        </p>
      </section>

      <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
        {rootUsers.length === 0 ? (
          <p className="text-sm text-black/55">No users in the system.</p>
        ) : (
          <RecruitTree recruits={rootUsers} />
        )}
      </div>

      {pendingInvitations.length > 0 && (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">
            Pending invitations ({pendingInvitations.length})
          </h2>
          <div className="mt-3 space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-amber-900">{inv.name}</span>
                  <span className="ml-2 text-amber-700">{inv.email}</span>
                </div>
                <span className="text-xs text-amber-600">
                  Sponsor: {inv.sponsor?.name ?? inv.sponsor?.email}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
