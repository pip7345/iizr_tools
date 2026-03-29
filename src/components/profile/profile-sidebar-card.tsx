import Link from "next/link";
import type { Route } from "next";

import { ImpersonateButton } from "@/components/profile/impersonate-button";
import { ReferralCodeCopy } from "@/components/profile/referral-code-copy";

export type SidebarStat = {
  label: string;
  value: string | number;
  href?: string;
  accent?: boolean;
};

type Props = {
  id: string;
  displayName: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "PENDING_SIGNUP";
  bio?: string | null;
  location?: string | null;
  joinedAt: Date;
  sponsor: { id: string; name: string | null } | null;
  recruitCount: number;
  balance: number;
  isOwnProfile?: boolean;
  canImpersonate?: boolean;
  extraStats?: SidebarStat[];
  referralCode?: { code: string; url: string };
};

export function ProfileSidebarCard({
  id,
  displayName,
  role,
  status,
  bio,
  location,
  joinedAt,
  sponsor,
  recruitCount,
  balance,
  isOwnProfile,
  canImpersonate,
  extraStats,
  referralCode,
}: Props) {
  return (
    <div className="space-y-5 rounded-lg border border-[hsl(var(--border))] card-gradient p-6">
      {/* Name + badges + optional impersonate */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            {displayName}
          </h2>
          {canImpersonate && <ImpersonateButton userId={id} />}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              role === "ADMIN"
                ? "bg-purple-500/20 text-purple-300"
                : "bg-white/10 text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {role.toLowerCase()}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "ACTIVE"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {status.toLowerCase()}
          </span>
        </div>
        {bio && (
          <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{bio}</p>
        )}
      </div>

      <div className="border-t border-[hsl(var(--border))]" />

      {/* Core stats */}
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Credit score
          </dt>
          <dd
            className={`text-xl font-semibold tabular-nums ${
              balance >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {balance >= 0 ? "+" : ""}
            {balance.toLocaleString()}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Recruits
          </dt>
          <dd className="text-sm font-medium">
            {isOwnProfile ? (
              <Link
                href="/dashboard"
                className="text-[hsl(var(--primary))] hover:underline"
              >
                {recruitCount}
              </Link>
            ) : (
              <span className="text-[hsl(var(--foreground))]">{recruitCount}</span>
            )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Member since
          </dt>
          <dd className="text-sm font-medium text-[hsl(var(--foreground))]">
            {joinedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
            })}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-2">
          <dt className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Sponsor
          </dt>
          <dd className="text-sm">
            {sponsor ? (
              <Link
                href={`/users/${sponsor.id}` as Route}
                className="font-medium text-[hsl(var(--primary))] hover:underline"
              >
                {sponsor.name}
              </Link>
            ) : isOwnProfile ? (
              <Link
                href="/sponsor"
                className="font-medium text-[hsl(var(--primary))] hover:underline"
              >
                Assign →
              </Link>
            ) : (
              <span className="text-[hsl(var(--muted-foreground))]">None</span>
            )}
          </dd>
        </div>

        {location && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Location
            </dt>
            <dd className="text-sm font-medium text-[hsl(var(--foreground))]">
              {location}
            </dd>
          </div>
        )}

        {/* Extra stats (e.g. pending invitations on dashboard) */}
        {extraStats?.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between gap-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              {stat.label}
            </dt>
            <dd
              className={`text-sm font-medium ${
                stat.accent
                  ? "text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--foreground))]"
              }`}
            >
              {stat.href ? (
                <Link href={stat.href as Route} className="hover:underline">
                  {stat.value}
                </Link>
              ) : (
                stat.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {referralCode && (
        <>
          <div className="border-t border-[hsl(var(--border))]" />
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Your referral link</p>
            <ReferralCodeCopy code={referralCode.code} url={referralCode.url} />
          </div>
        </>
      )}

      {isOwnProfile && (
        <>
          <div className="border-t border-[hsl(var(--border))]" />
          <Link
            href="/profile"
            className="text-sm font-medium text-[hsl(var(--primary))] hover:underline"
          >
            Edit profile →
          </Link>
        </>
      )}
    </div>
  );
}
