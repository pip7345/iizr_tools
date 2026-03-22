import { requireUser } from "@/lib/auth/user";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata = { title: "Edit Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,238,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Profile
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Edit your profile
        </h1>
      </section>

      <div className="max-w-lg">
        <ProfileForm
          preferredDisplayName={user.preferredDisplayName ?? ""}
          bio={user.bio ?? ""}
          location={user.location ?? ""}
        />
      </div>
    </div>
  );
}
