import { requireAdmin } from "@/lib/auth/user";
import { getUsersPage } from "@/lib/db/users";
import { getCreditBalances, getCreditCategories } from "@/lib/db/credits";
import { AdminUserList } from "@/components/admin/admin-user-list";

export const metadata = { title: "Admin: Users" };

const PAGE_SIZE = 25;

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
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const { users, total, totalPages } = await getUsersPage(
    { search, role, status },
    page,
    PAGE_SIZE,
  );

  const [creditBalances, categories] = await Promise.all([
    getCreditBalances(users.map((u) => u.id)),
    getCreditCategories(),
  ]);

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

      <AdminUserList
        users={users}
        currentAdminId={admin.id}
        creditBalances={creditBalances}
        categories={categories}
        page={page}
        totalPages={totalPages}
        total={total}
        currentSearch={search ?? ""}
        currentRole={role ?? ""}
        currentStatus={status ?? ""}
      />
    </div>
  );
}
