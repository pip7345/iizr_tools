import { requireUser } from "@/lib/auth/user";
import { getRecruitsTree } from "@/lib/db/users";
import { RecruitTree } from "@/components/hierarchy/recruit-tree";

export const metadata = { title: "Your Recruits" };

export default async function RecruitsPage() {
  const user = await requireUser();
  const recruits = await getRecruitsTree(user.id);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Recruits
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Your recruit hierarchy
        </h1>
      </section>

      {recruits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No recruits yet. Share your referral link to start building your network.
        </div>
      ) : (
        <div className="rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
          <RecruitTree recruits={recruits} />
        </div>
      )}
    </div>
  );
}
