import { requireAdmin } from "@/lib/auth/user";
import { getPendingNominations, getAllPendingInvitationCredits } from "@/lib/db/credits";
import { NominationApprovalList } from "@/components/admin/nomination-approval-list";
import { InvitationCreditApprovalList } from "@/components/admin/invitation-credit-approval-list";

export const metadata = { title: "Admin: Nominations" };

export default async function AdminNominationsPage() {
  await requireAdmin();

  const [nominations, invitationCredits] = await Promise.all([
    getPendingNominations(),
    getAllPendingInvitationCredits(),
  ]);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Credit nominations
        </h1>
      </section>

      <div className="grid gap-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[var(--color-foreground)]">
            User credit nominations ({nominations.length})
          </h2>
          <NominationApprovalList nominations={nominations} />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[var(--color-foreground)]">
            Invitation credit grants ({invitationCredits.length})
          </h2>
          <InvitationCreditApprovalList grants={invitationCredits} />
        </section>
      </div>
    </div>
  );
}
