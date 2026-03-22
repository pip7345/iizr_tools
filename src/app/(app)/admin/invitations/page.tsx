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
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          All pending invitations
        </h1>
      </section>

      {invitations.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
          No pending invitations.
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <article
              key={inv.id}
              className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                      {inv.name}
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      pending
                    </span>
                  </div>
                  <p className="text-sm text-black/55">{inv.email}</p>
                  <p className="text-xs text-black/40">
                    Sponsor: {inv.sponsor?.name ?? inv.sponsor?.email} ·
                    Created {formatDate(inv.createdAt)}
                  </p>
                  {inv.creditGrants.length > 0 && (
                    <p className="text-xs text-black/40">
                      {inv.creditGrants.length} credit grant{inv.creditGrants.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                <code className="rounded-xl bg-black/5 px-3 py-1 font-mono text-xs">
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
