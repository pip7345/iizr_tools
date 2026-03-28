import { requireUser } from "@/lib/auth/user";
import { getReferralCodesForUser } from "@/lib/db/referral-codes";
import { createReferralCodeAction, deleteReferralCodeAction } from "@/actions/referral-actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Referral Codes" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export default async function ReferralsPage() {
  const user = await requireUser();
  const codes = await getReferralCodesForUser(user.id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Referrals
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Your referral codes
          </h1>
          <form action={createReferralCodeAction}>
            <Button type="submit">Generate new code</Button>
          </form>
        </div>
      </section>

      {codes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No referral codes yet. Generate one to start inviting people.
        </div>
      ) : (
        <div className="grid gap-4">
          {codes.map((code) => {
            const link = `${baseUrl}/sign-up?referral=${code.code}`;
            const deleteAction = deleteReferralCodeAction.bind(null, code.id);
            const isExpired = code.expiresAt < new Date();

            return (
              <article
                key={code.id}
                className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <code className="rounded-lg bg-[hsl(var(--muted))/0.5] px-3 py-1 font-mono text-sm font-medium">
                        {code.code}
                      </code>
                      {isExpired && (
                        <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="break-all text-sm text-[hsl(var(--muted-foreground))]">
                      {link}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Created {formatDate(code.createdAt)} · Expires {formatDate(code.expiresAt)}
                    </p>
                  </div>
                  <form action={deleteAction}>
                    <Button type="submit" variant="danger">
                      Delete
                    </Button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
