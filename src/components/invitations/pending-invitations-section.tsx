"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import {
  createInvitationAction,
  deleteInvitationAction,
  updateInvitationAction,
} from "@/actions/invitation-actions";
import type { ActionState } from "@/actions/user-actions";

type Invitation = {
  id: string;
  name: string | null;
  email: string | null;
  signupCode: string | null;
};

const INIT: ActionState = { status: "idle", message: "" };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
          </svg>
          Copy link
        </>
      )}
    </button>
  );
}

function CreateForm({
  onDone,
}: {
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createInvitationAction, INIT);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        formRef.current?.reset();
        onDone();
      });
    }
  }, [state, onDone]);

  return (
    <form ref={formRef} action={formAction}>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)] p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Name
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Jane Smith"
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[hsl(var(--primary))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Add"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            Cancel
          </button>
        </div>
        {state.status === "error" && (
          <p className="col-span-2 text-xs text-red-400">{state.message}</p>
        )}
      </div>
    </form>
  );
}

function EditRow({
  invitation,
  onDone,
}: {
  invitation: Invitation;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateInvitationAction, INIT);

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        onDone();
      });
    }
  }, [state, onDone]);

  return (
    <tr className="bg-[hsl(var(--muted)/0.15)]">
      <td colSpan={4} className="px-5 py-3">
        <form action={formAction}>
          <input type="hidden" name="userId" value={invitation.id} />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Name
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={invitation.name ?? ""}
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
              />
              {state.errors?.name && (
                <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[hsl(var(--primary))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--primary-foreground))] shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                Cancel
              </button>
            </div>
          </div>
          {state.status === "error" && (
            <p className="mt-2 text-xs text-red-400">{state.message}</p>
          )}
        </form>
      </td>
    </tr>
  );
}

function InvitationRow({
  invitation,
  appUrl,
  isAdmin,
}: {
  invitation: Invitation;
  appUrl: string;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const referralUrl = invitation.signupCode
    ? `${appUrl}/api/referral?claim=${invitation.signupCode}`
    : "";

  async function handleDelete() {
    setDeleting(true);
    await deleteInvitationAction(invitation.id);
    setDeleting(false);
    setConfirmDelete(false);
  }

  if (editing) {
    return <EditRow invitation={invitation} onDone={() => setEditing(false)} />;
  }

  return (
    <tr className="hover:bg-[hsl(var(--muted)/0.3)]">
      <td className="px-5 py-3.5 text-sm text-[hsl(var(--foreground))]">{invitation.name}</td>
      <td className="px-5 py-3.5 text-sm text-[hsl(var(--muted-foreground))]">{invitation.email ?? <span className="opacity-40">—</span>}</td>
      <td className="px-5 py-3.5">
        <CopyButton text={referralUrl} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="inline-flex items-center gap-3">
            {confirmDelete ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  No
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-3">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs font-medium text-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              </span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function PendingInvitationsSection({
  invitations,
  appUrl,
  isAdmin,
}: {
  invitations: Invitation[];
  appUrl: string;
  isAdmin: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Pending invitations
        </h2>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] shadow-sm hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
          >
            + New invitation
          </button>
        )}
      </div>

      {showCreate && (
        <CreateForm onDone={() => setShowCreate(false)} />
      )}

      {invitations.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))/0.7] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No pending invitations. Click &ldquo;+ New invitation&rdquo; to invite someone.
        </div>
      ) : invitations.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] card-gradient shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Referral link
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {invitations.map((inv) => (
                <InvitationRow key={inv.id} invitation={inv} appUrl={appUrl} isAdmin={isAdmin} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
