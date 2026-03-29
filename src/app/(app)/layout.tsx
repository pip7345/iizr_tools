import Link from "next/link";

import { UserButton } from "@clerk/nextjs";

import { SignOutBtn } from "@/components/ui/sign-out-button";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client/index";

import { getImpersonationInfo, getRealUser } from "@/lib/auth/user";
import { stopImpersonationAction } from "@/actions/admin-actions";

/* Navigation links for the sidebar */
const navLinks = [
  { label: "Dashboard", href: "/dashboard" as const, icon: DashboardIcon },
  { label: "Invitations", href: "/invitations" as const, icon: InvitationIcon },
  { label: "Credits", href: "/credits" as const, icon: CreditIcon },
];

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
    <div className="h-[100dvh] bg-gradient-hero flex overflow-hidden">
      {/* ── Background glow blobs ──────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 will-change-transform">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-80 bg-glow-fuchsia animate-blob" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60 bg-glow-blue animate-blob animation-delay-2000" />
        <div className="absolute -bottom-48 -right-32 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-80 bg-glow-cyan animate-blob animation-delay-4000" />
      </div>

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-[100dvh] w-72 bg-gradient-card border-r border-[hsl(var(--border))] z-50 flex-col overflow-hidden hidden lg:flex">
        {/* Brand */}
        <div className="flex items-center h-16 px-6 border-b border-[hsl(var(--border))]">
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-8 bg-gradient-primary rounded-lg flex items-center justify-center animate-glow px-3">
              <span className="text-white font-bold text-sm">iiZR</span>
            </div>
            <span className="text-gradient text-sm font-medium">Tools</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-item flex items-center space-x-3 px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <link.icon />
              <span>{link.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="nav-item flex items-center space-x-3 px-4 py-3 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <AdminIcon />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="mt-auto p-4 border-t border-[hsl(var(--border))]">
          <div className="flex items-center space-x-3 p-3">
            <UserButton />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                {user.preferredDisplayName ?? user.name ?? user.email}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {user.email}
              </p>
            </div>
          </div>
          <SignOutBtn className="nav-item flex items-center space-x-3 px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] w-full" />
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Impersonation banner */}
        {impersonation && (
          <div className="border-b border-amber-500/30 bg-amber-900/40 px-6 py-2 text-center text-sm">
            <span className="text-amber-200">
              Impersonating <strong>{impersonation.impersonatedUser.name}</strong> ({impersonation.impersonatedUser.email})
            </span>
            <form action={stopImpersonationAction} className="ml-4 inline">
              <button
                type="submit"
                className="rounded-full bg-amber-500/30 px-3 py-1 text-xs font-medium text-amber-100 transition hover:bg-amber-500/50"
              >
                Stop impersonating
              </button>
            </form>
          </div>
        )}

        {/* Top header bar */}
        <header className="h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] backdrop-blur-sm flex items-center px-6 flex-shrink-0 relative z-10">
          <div className="flex-1">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Home</Link>
            </nav>
          </div>
          {/* Mobile: show sidebar links inline */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto mr-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition"
              >
                Admin
              </Link>
            )}
          </div>
          <div className="lg:hidden">
            <UserButton />
          </div>
        </header>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 relative z-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Inline SVG icon components ──────────────────────────── */

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function InvitationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
