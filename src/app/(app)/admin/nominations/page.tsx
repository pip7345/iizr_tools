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
            User credit nominations ({nominations.length})
          </h2>
          <NominationApprovalList nominations={nominations} />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-[hsl(var(--foreground))]">
            Invitation credit grants ({invitationCredits.length})
          </h2>
          <InvitationCreditApprovalList grants={invitationCredits} />
        </section>
      </div>
    </div>
  );
}
