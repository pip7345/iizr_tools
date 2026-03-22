import { requireAdmin } from "@/lib/auth/user";
import { getAllUsers } from "@/lib/db/users";
import { AdminCreditForm } from "@/components/admin/admin-credit-form";

export const metadata = { title: "Admin: Credits" };

export default async function AdminCreditsPage() {
  await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Credit management
        </h1>
        <p className="text-base leading-8 text-black/65">
          Directly create positive or negative credit transactions for any user.
        </p>
      </section>

      <div className="max-w-lg">
        <AdminCreditForm
          users={users.map((u) => ({
            id: u.id,
            name: u.preferredDisplayName ?? u.name ?? u.email,
            email: u.email,
          }))}
        />
      </div>
    </div>
  );
}
