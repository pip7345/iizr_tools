import Link from "next/link";

import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await auth.protect();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,86,39,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(10,84,74,0.18),_transparent_26%),var(--color-background)]">
      <header className="border-b border-black/8 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/40">
              Production starter
            </p>
            <Link href="/dashboard" className="text-xl font-semibold text-[var(--color-foreground)]">
              iizr_tools
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-black/55 transition hover:text-[var(--color-foreground)]"
            >
              Home
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
