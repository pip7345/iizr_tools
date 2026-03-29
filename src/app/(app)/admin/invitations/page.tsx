import { headers } from "next/headers";

import { requireAdmin } from "@/lib/auth/user";
import { getPendingInvitations } from "@/lib/db/invitations";
import { getAllUsers, getUsersWithEmails } from "@/lib/db/users";
import { AdminInvitationsTable } from "@/components/admin/admin-invitations-table";

export const metadata = { title: "Admin: Invitations" };

export default async function AdminInvitationsPage() {
  await requireAdmin();

  const [invitations, allUsers] = await Promise.all([
    getPendingInvitations(),
    getAllUsers(),
  ]);

  const emailsToCheck = invitations
    .map((i) => i.email)
    .filter((e): e is string => e !== null);
  const existingEmails = await getUsersWithEmails(emailsToCheck);

  const mapped = invitations.map((inv) => ({
    id: inv.id,
    name: inv.name,
    email: inv.email,
    createdAt: inv.createdAt,
    referralCode: inv.referralCode,
    sponsor: inv.sponsor ?? null,
    userExists: inv.email !== null && existingEmails.has(inv.email),
  }));

  const sponsors = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    preferredDisplayName: u.preferredDisplayName,
  }));

  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const appUrl = `${protocol}://${host}`;

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          All pending invitations
        </h1>
      </section>

      <AdminInvitationsTable
        invitations={mapped}
        sponsors={sponsors}
        appUrl={appUrl}
      />
    </div>
  );
}

