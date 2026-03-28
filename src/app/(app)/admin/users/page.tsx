import { requireAdmin } from "@/lib/auth/user";
import { getAllUsers } from "@/lib/db/users";
import { getCreditBalances } from "@/lib/db/credits";
import { AdminUserList } from "@/components/admin/admin-user-list";

export const metadata = { title: "Admin: Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const search = params.search ?? undefined;
  const role = params.role as "ADMIN" | "USER" | undefined;
  const status = params.status as "ACTIVE" | "INACTIVE" | undefined;

  const users = await getAllUsers({
    search,
    role: role || undefined,
    status: status || undefined,
  });

  const creditBalances = await getCreditBalances(users.map((u) => u.id));

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,255,0.96))] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-black/40">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          User management
        </h1>
      </section>

      <AdminUserList users={users} currentAdminId={admin.id} creditBalances={creditBalances} />
    </div>
  );
}
