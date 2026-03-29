"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import {
  adminCreateInvitationAction,
  adminCreateUserFromInvitationAction,
  adminCreateUserFromInvitationWithEmailAction,
} from "@/actions/admin-actions";
import type { ActionState } from "@/actions/user-actions";

type Sponsor = {
  id: string;
  name: string | null;
  email: string;
  preferredDisplayName: string | null;
};

type Invitation = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
  referralCode: { code: string };
  sponsor: { id: string; name: string | null; email: string } | null;
  userExists: boolean;
};

const INIT: ActionState = { status: "idle", message: "" };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center gap-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function CreateUserCell({
  invitationId,
  initialEmail,
  initialExists,
}: {
  invitationId: string;
  initialEmail: string | null;
  initialExists: boolean;
}) {
  const [exists, setExists] = useState(initialExists);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // shown when no email on the invitation
  const [emailState, emailFormAction, emailPending] = useActionState(
    adminCreateUserFromInvitationWithEmailAction,
    { status: "idle", message: "" } as import("@/actions/user-actions").ActionState,
  );

  useEffect(() => {
    if (emailState.status === "success") setExists(true);
  }, [emailState]);

  if (exists) {
    return <span className="text-xs font-medium text-emerald-400">User created</span>;
  }

  // Invitation has an email — simple one-click button
  if (initialEmail) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const r = await adminCreateUserFromInvitationAction(invitationId);
            setPending(false);
            if (r.status === "success") setExists(true);
            else setError(r.message ?? null);
          }}
          className="text-xs font-medium text-[hsl(var(--primary))] hover:opacity-80 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  // No email — show inline email entry
  return (
    <form action={emailFormAction} className="flex flex-col gap-1">
      <input type="hidden" name="invitationId" value={invitationId} />
      <div className="flex items-center gap-1">
        <input
          name="email"
          type="email"
          required
          placeholder="email@example.com"
          className="w-40 rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-0.5 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary)/0.5)]"
        />
        <button
          type="submit"
          disabled={emailPending}
          className="rounded bg-[hsl(var(--primary))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
        >
          {emailPending ? "…" : "Create"}
        </button>
      </div>
      {emailState.status === "error" && (
        <span className="text-xs text-red-400">{emailState.message}</span>
      )}
    </form>
  );
}

function CreateForm({
  sponsors,
  onDone,
}: {
  sponsors: Sponsor[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(adminCreateInvitationAction, INIT);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        formRef.current?.reset();
        onDone();
      });
    }
  }, [state, onDone]);

  const inputCls =
    "w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary)/0.5)]";

  return (
    <form ref={formRef} action={formAction}>
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.15)] px-4 py-3">
        {/* Sponsor */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Sponsor <span className="text-red-400">*</span>
          </label>
          <select name="sponsorId" required className={inputCls}>
            <option value="">— select sponsor —</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.preferredDisplayName ?? s.name ?? s.email}
              </option>
            ))}
          </select>
          {state.errors?.sponsorId && (
            <p className="mt-0.5 text-xs text-red-400">{state.errors.sponsorId[0]}</p>
          )}
        </div>
        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Name <span className="text-red-400">*</span>
          </label>
          <input name="name" type="text" required placeholder="Jane Smith" className={inputCls} />
          {state.errors?.name && (
            <p className="mt-0.5 text-xs text-red-400">{state.errors.name[0]}</p>
          )}
        </div>
        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Email <span className="font-normal opacity-60">(optional)</span>
          </label>
          <input name="email" type="email" placeholder="jane@example.com" className={inputCls} />
          {state.errors?.email && (
            <p className="mt-0.5 text-xs text-red-400">{state.errors.email[0]}</p>
          )}
        </div>
        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Add"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            Cancel
          </button>
        </div>
        {state.status === "error" && !Object.keys(state.errors ?? {}).length && (
          <p className="col-span-4 text-xs text-red-400">{state.message}</p>
        )}
      </div>
    </form>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function AdminInvitationsTable({
  invitations,
  sponsors,
  appUrl,
}: {
  invitations: Invitation[];
  sponsors: Sponsor[];
  appUrl: string;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] card-gradient shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          {invitations.length} pending
        </span>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
          >
            + New invitation
          </button>
        )}
      </div>

      {/* Inline create form */}
      {showCreate && (
        <CreateForm sponsors={sponsors} onDone={() => setShowCreate(false)} />
      )}

      {invitations.length === 0 && !showCreate ? (
        <div className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No pending invitations.
        </div>
      ) : invitations.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
              {["Invitee", "Email", "Sponsor", "Code", "Created", "User", ""].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))] last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {invitations.map((inv) => {
              const referralUrl = `${appUrl}/api/referral?referral=${inv.referralCode.code}`;
              return (
                <tr key={inv.id} className="hover:bg-[hsl(var(--muted)/0.2)]">
                  <td className="px-3 py-2 font-medium text-[hsl(var(--foreground))]">
                    {inv.name}
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">
                    {inv.email ?? <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">
                    {inv.sponsor?.name ?? inv.sponsor?.email ?? <span className="opacity-40">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <code className="rounded bg-[hsl(var(--muted)/0.5)] px-1.5 py-0.5 font-mono text-xs">
                      {inv.referralCode.code}
                    </code>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDate(inv.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <CreateUserCell
                      invitationId={inv.id}
                      initialEmail={inv.email}
                      initialExists={inv.userExists}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <CopyButton text={referralUrl} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
