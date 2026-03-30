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
  const status = params.status as "ACTIVE" | "INACTIVE" | "PENDING_SIGNUP" | undefined;

  const users = await getAllUsers({
    search,
    role: role || undefined,
    status: status || undefined,
  });

  const creditBalances = await getCreditBalances(users.map((u) => u.id));

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 rounded-lg card-gradient p-8 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
          User management
        </h1>
      </section>

      <AdminUserList users={users} currentAdminId={admin.id} creditBalances={creditBalances} />
    </div>
  );
}
