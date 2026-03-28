import { requireAdmin } from "@/lib/auth/user";
import { getPendingInvitations } from "@/lib/db/invitations";

export const metadata = { title: "Admin: Invitations" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export default async function AdminInvitationsPage() {
  await requireAdmin();
  const invitations = await getPendingInvitations();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          All pending invitations
        </h1>
      </section>

      {invitations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No pending invitations.
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <article
              key={inv.id}
              className="rounded-lg border border-[hsl(var(--border))] card-gradient p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
                      {inv.name}
                    </h3>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                      pending
                    </span>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{inv.email}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Sponsor: {inv.sponsor?.name ?? inv.sponsor?.email} ·
                    Created {formatDate(inv.createdAt)}
                  </p>
                  {inv.creditGrants.length > 0 && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {inv.creditGrants.length} credit grant{inv.creditGrants.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                <code className="rounded-lg bg-[hsl(var(--muted))/0.5] px-3 py-1 font-mono text-xs">
                  {inv.referralCode.code}
                </code>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
