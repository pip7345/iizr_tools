import { requireAdmin } from "@/lib/auth/user";
import { getAllUsers } from "@/lib/db/users";
import { AdminCreditForm } from "@/components/admin/admin-credit-form";

export const metadata = { title: "Admin: Credits" };

export default async function AdminCreditsPage() {
  await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Credit management
        </h1>
        <p className="text-base leading-8 text-[hsl(var(--muted-foreground))]">
          Directly create positive or negative credit transactions for any user.
        </p>
      </section>

      <div className="max-w-lg">
        <AdminCreditForm
          users={users.map((u) => ({
            id: u.id,
            name: u.preferredDisplayName ?? u.name ?? u.email ?? u.id,
            email: u.email,
          }))}
        />
      </div>
    </div>
  );
}
