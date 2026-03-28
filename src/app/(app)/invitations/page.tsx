import { requireUser } from "@/lib/auth/user";
import { getInvitationsForSponsor } from "@/lib/db/invitations";
import { deleteInvitationAction } from "@/actions/invitation-actions";
import { InvitationForm } from "@/components/invitations/invitation-form";
import { InvitationCreditForm } from "@/components/invitations/invitation-credit-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Invitations" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export default async function InvitationsPage() {
  const user = await requireUser();
  const invitations = await getInvitationsForSponsor(user.id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Invitations
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Manage invitations
        </h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <InvitationForm />

        <div className="grid gap-4">
          {invitations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No invitations yet. Create one to invite someone to join.
            </div>
          ) : (
            invitations.map((invitation) => {
              const deleteAction = deleteInvitationAction.bind(null, invitation.id);
              const isPending = invitation.status === "PENDING";
              const link = `${baseUrl}/sign-up?referral=${invitation.referralCode.code}`;

              return (
                <article
                  key={invitation.id}
                  className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                          {invitation.name}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-500/20 text-amber-400"
                              : invitation.status === "CLAIMED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {invitation.status.toLowerCase()}
                        </span>
                      </div>
                      {isPending && (
                        <form action={deleteAction}>
                          <Button type="submit" variant="danger">
                            Delete
                          </Button>
                        </form>
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{invitation.email}</p>
                    {isPending && (
                      <p className="break-all text-xs text-[hsl(var(--muted-foreground))]">{link}</p>
                    )}
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Created {formatDate(invitation.createdAt)}
                    </p>

                    {invitation.creditGrants.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          Credit grants
                        </p>
                        {invitation.creditGrants.map((grant) => (
                          <div
                            key={grant.id}
                            className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted))/0.3] px-3 py-2 text-sm"
                          >
                            <span>{grant.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{grant.amount}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  grant.status === "APPROVED"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : grant.status === "PENDING"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : grant.status === "CONVERTED"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {grant.status.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isPending && (
                      <InvitationCreditForm invitationId={invitation.id} />
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
