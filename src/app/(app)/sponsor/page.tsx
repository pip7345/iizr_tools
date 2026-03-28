import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { getEligibleSponsors } from "@/lib/db/users";
import { SponsorPicker } from "@/components/sponsor/sponsor-picker";

export const metadata = { title: "Assign Sponsor" };

export default async function SponsorPage() {
  const user = await requireUser();

  if (user.sponsorId) {
    redirect("/dashboard");
  }

  const eligibleSponsors = await getEligibleSponsors(user.id);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Sponsor
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Choose your sponsor
        </h1>
        <p className="max-w-2xl text-base leading-8 text-[hsl(var(--muted-foreground))]">
          This is a one-time action. Once you select a sponsor, only an administrator can change it.
        </p>
      </section>

      <div className="max-w-lg">
        <SponsorPicker sponsors={eligibleSponsors} />
      </div>
    </div>
  );
}
