"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  grantAdminAction,
  revokeAdminAction,
  startImpersonationAction,
  reassignSponsorAction,
} from "@/actions/admin-actions";
import {
  GiveCreditsModal,
  type CreditCategoryOption,
} from "@/components/ui/give-credits-modal";

export type { CreditCategoryOption };

export type ActionUser = {
  id: string;
  name: string | null;
  email: string | null;
  preferredDisplayName: string | null;
  role: string;
  sponsorId?: string | null;
};

type UserActionsCellProps = {
  user: ActionUser;
  /** ID of the currently logged-in viewer, used to render "you" for self-rows */
  viewerCurrentUserId: string;
  /**
   * Determines which actions are available:
   * - "admin"  : full admin actions (give credits, grant/revoke admin, impersonate, remove sponsor)
   * - "sponsor": nominate credits only (non-admin direct sponsor of this user)
   * - "none"   : no actions
   */
  mode: "admin" | "sponsor" | "none";
  categories: CreditCategoryOption[];
};

export function UserActionsCell({
  user,
  viewerCurrentUserId,
  mode,
  categories,
}: UserActionsCellProps) {
  const router = useRouter();
  const [action, setAction] = useState("__select__");
  const [pending, setPending] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  if (user.id === viewerCurrentUserId) {
    return <span className="text-xs opacity-40">you</span>;
  }

  if (mode === "none") {
    return <span className="text-xs opacity-30">—</span>;
  }

  const displayName =
    user.preferredDisplayName ?? user.name ?? user.email ?? user.id;

  // ── sponsor-only mode: just a nominate button ─────────
  if (mode === "sponsor") {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowCreditsModal(true)}
          className="rounded border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.08)] px-3 py-1 text-xs font-medium text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.18)]"
        >
          Nominate credits
        </button>
        {showCreditsModal && (
          <GiveCreditsModal
            userId={user.id}
            userName={displayName}
            categories={categories}
            isAdmin={false}
            onClose={() => setShowCreditsModal(false)}
          />
        )}
      </>
    );
  }

  // ── admin mode: full dropdown ─────────────────────────
  async function execute() {
    if (action === "__select__") return;
    if (action === "give-credits") {
      setShowCreditsModal(true);
      return;
    }
    setPending(true);
    try {
      if (action === "grant-admin") {
        await grantAdminAction(user.id);
        router.refresh();
      } else if (action === "revoke-admin") {
        await revokeAdminAction(user.id);
        router.refresh();
      } else if (action === "impersonate") {
        await startImpersonationAction(user.id);
        router.push("/dashboard");
        router.refresh();
      } else if (action === "remove-sponsor") {
        await reassignSponsorAction(user.id, null);
        router.refresh();
      }
    } finally {
      setPending(false);
      setAction("__select__");
    }
  }

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="h-7 rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 text-xs text-[hsl(var(--foreground))] focus:outline-none"
        disabled={pending}
      >
        <option value="__select__">Select action</option>
        <option value="give-credits">Give credits</option>
        {user.role === "USER" ? (
          <option value="grant-admin">Grant admin</option>
        ) : (
          <option value="revoke-admin">Revoke admin</option>
        )}
        <option value="impersonate">Impersonate</option>
        {user.sponsorId && (
          <option value="remove-sponsor">Remove sponsor</option>
        )}
      </select>
      <button
        onClick={execute}
        disabled={action === "__select__" || pending}
        className="h-7 rounded border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.08)] px-3 text-xs font-medium text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.18)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "…" : "Execute"}
      </button>
      {showCreditsModal && (
        <GiveCreditsModal
          userId={user.id}
          userName={displayName}
          categories={categories}
          isAdmin={true}
          onClose={() => {
            setShowCreditsModal(false);
            setAction("__select__");
          }}
        />
      )}
    </div>
  );
}
