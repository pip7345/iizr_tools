import { requireUser } from "@/lib/auth/user";
import { getRecruitsTree } from "@/lib/db/users";
import { RecruitTree } from "@/components/hierarchy/recruit-tree";

export const metadata = { title: "Your Recruits" };

export default async function RecruitsPage() {
  const user = await requireUser();
  const recruits = await getRecruitsTree(user.id);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Recruits
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Your recruit hierarchy
        </h1>
      </section>

      {recruits.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/70 p-8 text-center text-sm text-black/60">
          No recruits yet. Share your referral link to start building your network.
        </div>
      ) : (
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <RecruitTree recruits={recruits} />
        </div>
      )}
    </div>
  );
}
