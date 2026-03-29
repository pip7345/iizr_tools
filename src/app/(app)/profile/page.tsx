import { requireUser } from "@/lib/auth/user";
import { getCreditBalance } from "@/lib/db/credits";
import { getRecruitsTree, getUserById } from "@/lib/db/users";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSidebarCard } from "@/components/profile/profile-sidebar-card";

export const metadata = { title: "Edit Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  const [creditBalance, recruits, userWithSponsor] = await Promise.all([
    getCreditBalance(user.id),
    getRecruitsTree(user.id),
    getUserById(user.id),
  ]);

  const sponsor = userWithSponsor?.sponsor ?? null;
  const sponsorInfo = sponsor
    ? { id: sponsor.id, name: sponsor.preferredDisplayName ?? sponsor.name ?? sponsor.email }
    : null;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Profile</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Edit your profile
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT: profile + stats card */}
        <div className="lg:self-start">
          <ProfileSidebarCard
            id={user.id}
            displayName={user.preferredDisplayName ?? user.name ?? user.email ?? ""}
            role={user.role}
            status={user.status}
            bio={user.bio}
            location={user.location}
            joinedAt={user.joinedAt}
            sponsor={sponsorInfo}
            recruitCount={recruits.length}
            balance={creditBalance}
            isOwnProfile
          />
        </div>

        {/* RIGHT: edit form */}
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">            Edit details
          </h2>
          <ProfileForm
            preferredDisplayName={user.preferredDisplayName ?? ""}
            bio={user.bio ?? ""}
            location={user.location ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
