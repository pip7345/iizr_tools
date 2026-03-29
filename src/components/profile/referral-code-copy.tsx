"use client";

import { useState } from "react";

type ReferralCodeCopyProps = {
  code: string;
  url: string;
};

export function ReferralCodeCopy({ code, url }: ReferralCodeCopyProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCopy}
        title="Click to copy your referral link"
        className="group flex w-full items-center justify-between gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.4] px-3 py-2 text-left transition hover:border-[hsl(var(--primary))/0.5] hover:bg-[hsl(var(--muted))/0.6]"
      >
        <code className="font-mono text-xs font-semibold tracking-wider text-[hsl(var(--foreground))]">
          {code}
        </code>
        <span
          className={`shrink-0 text-[10px] font-medium uppercase tracking-wider transition ${
            copied ? "text-emerald-400" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]"
          }`}
        >
          {copied ? "Copied!" : "Copy link"}
        </span>
      </button>
      <p className="text-[10px] leading-4 text-[hsl(var(--muted-foreground))]">
        Share this code in an email or text message to invite someone. They&apos;ll be linked to you when they sign up.
      </p>
    </div>
  );
}
