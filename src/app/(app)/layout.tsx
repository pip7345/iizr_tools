import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client/index";

import { getImpersonationInfo, getRealUser } from "@/lib/auth/user";
import { stopImpersonationAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  const user = await getRealUser();
  const impersonation = await getImpersonationInfo();
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,86,39,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(10,84,74,0.18),_transparent_26%),var(--color-background)]">
      {impersonation && (
        <div className="border-b border-amber-300 bg-amber-50 px-6 py-2 text-center text-sm">
          <span className="text-amber-800">
            Impersonating <strong>{impersonation.impersonatedUser.name}</strong> ({impersonation.impersonatedUser.email})
          </span>
          <form action={stopImpersonationAction} className="ml-4 inline">
            <button
              type="submit"
              className="rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-300"
            >
              Stop impersonating
            </button>
          </form>
        </div>
      )}
      <header className="border-b border-black/8 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/40">
              Referral &amp; Credits
            </p>
            <Link href="/dashboard" className="text-xl font-semibold text-[var(--color-foreground)]">
              iizr_tools
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-2 text-sm font-medium text-black/55 transition hover:bg-black/5 hover:text-[var(--color-foreground)]"
            >
              Dashboard
            </Link>
            <Link
              href="/referrals"
              className="rounded-full px-3 py-2 text-sm font-medium text-black/55 transition hover:bg-black/5 hover:text-[var(--color-foreground)]"
            >
              Referrals
            </Link>
            <Link
              href="/invitations"
              className="rounded-full px-3 py-2 text-sm font-medium text-black/55 transition hover:bg-black/5 hover:text-[var(--color-foreground)]"
            >
              Invitations
            </Link>
            <Link
              href="/credits"
              className="rounded-full px-3 py-2 text-sm font-medium text-black/55 transition hover:bg-black/5 hover:text-[var(--color-foreground)]"
            >
              Credits
            </Link>
            <Link
              href="/recruits"
              className="rounded-full px-3 py-2 text-sm font-medium text-black/55 transition hover:bg-black/5 hover:text-[var(--color-foreground)]"
            >
              Recruits
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <Button variant="secondary" className="px-3 py-2 text-xs">
                  Admin
                </Button>
              </Link>
            )}
            <Link
              href="/"
              className="text-sm font-medium text-black/55 transition hover:text-[var(--color-foreground)]"
            >
              Home
            </Link>
            <UserButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
