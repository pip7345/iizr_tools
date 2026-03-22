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
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Sponsor
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Choose your sponsor
        </h1>
        <p className="max-w-2xl text-base leading-8 text-black/65">
          This is a one-time action. Once you select a sponsor, only an administrator can change it.
        </p>
      </section>

      <div className="max-w-lg">
        <SponsorPicker sponsors={eligibleSponsors} />
      </div>
    </div>
  );
}
