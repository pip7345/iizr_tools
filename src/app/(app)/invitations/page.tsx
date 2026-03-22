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
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Invitations
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Manage invitations
        </h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <InvitationForm />

        <div className="grid gap-4">
          {invitations.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
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
                  className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                          {invitation.name}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-100 text-amber-700"
                              : invitation.status === "CLAIMED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
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
                    <p className="text-sm text-black/55">{invitation.email}</p>
                    {isPending && (
                      <p className="break-all text-xs text-black/40">{link}</p>
                    )}
                    <p className="text-xs text-black/40">
                      Created {formatDate(invitation.createdAt)}
                    </p>

                    {invitation.creditGrants.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-black/40">
                          Credit grants
                        </p>
                        {invitation.creditGrants.map((grant) => (
                          <div
                            key={grant.id}
                            className="flex items-center justify-between rounded-xl bg-black/3 px-3 py-2 text-sm"
                          >
                            <span>{grant.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{grant.amount}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  grant.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : grant.status === "PENDING"
                                      ? "bg-amber-100 text-amber-700"
                                      : grant.status === "CONVERTED"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
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
