"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  signupCode: string;
  userName?: string | null;
  onClose: () => void;
};

export function SignupLinkModal({ signupCode, userName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const signupUrl = `${appUrl}/api/referral?claim=${signupCode}`;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-[hsl(var(--card))] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-1 text-lg font-semibold text-[hsl(var(--foreground))]">
          Signup link
        </h2>
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          Share this link with{" "}
          {userName ? <strong className="text-[hsl(var(--foreground))]">{userName}</strong> : "this user"}{" "}
          via SMS, email, or any messaging app to complete their signup.
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-[hsl(var(--foreground))]">
            {signupUrl}
          </span>
          <button
            onClick={copy}
            className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition ${
              copied
                ? "text-emerald-400"
                : "text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)]"
            }`}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          Once they click the link, they&apos;ll be guided through creating their account.
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
