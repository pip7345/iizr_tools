import { requireUser } from "@/lib/auth/user";
import { getCreditBalance, getCreditHistory, getNominationsForUser } from "@/lib/db/credits";
import { SpendCreditsForm } from "@/components/credits/spend-credits-form";
import { NominateCreditForm } from "@/components/credits/nominate-credit-form";
import { getRecruitsTree } from "@/lib/db/users";

export const metadata = { title: "Credits" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function CreditsPage() {
  const user = await requireUser();

  const [balance, history, nominations, recruits] = await Promise.all([
    getCreditBalance(user.id),
    getCreditHistory(user.id),
    getNominationsForUser(user.id),
    getRecruitsTree(user.id),
  ]);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">Credits</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
            Your credits
          </h1>
          <div className="rounded-2xl bg-[var(--color-sage)] px-6 py-3 text-white">
            <p className="text-xs uppercase tracking-widest opacity-70">Balance</p>
            <p className="text-3xl font-semibold">{balance}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-6">
          <SpendCreditsForm balance={balance} />
          {recruits.length > 0 && (
            <NominateCreditForm recruits={recruits} />
          )}
        </div>

        <div className="grid gap-6">
          {/* Transaction History */}
          <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Transaction history
            </h2>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-black/55">No credit transactions yet.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {history.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-black/40">
                        {formatDate(tx.createdAt)}
                        {tx.nominator && ` · by ${tx.nominator.name}`}
                      </p>
                    </div>
                    <span
                      className={`font-mono font-semibold ${
                        tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Nominations */}
          <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Nominations
            </h2>
            {nominations.length === 0 ? (
              <p className="mt-4 text-sm text-black/55">No nominations yet.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {nominations.map((nom) => (
                  <div
                    key={nom.id}
                    className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{nom.description}</p>
                      <p className="text-xs text-black/40">
                        For {nom.user.name} · by {nom.nominator.name} · {formatDate(nom.createdAt)}
                      </p>
                      {nom.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">
                          Rejected: {nom.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{nom.amount}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          nom.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : nom.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {nom.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
