"use client";

import { useState } from "react";

type Recruit = {
  id: string;
  name: string | null;
  email: string;
  preferredDisplayName: string | null;
  role: string;
  status: string;
  joinedAt: Date;
  _count: { recruits: number };
};

type RecruitTreeProps = {
  recruits: Recruit[];
};

function RecruitNode({ recruit }: { recruit: Recruit }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Recruit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const hasChildren = recruit._count.recruits > 0;

  async function toggle() {
    if (!hasChildren) return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    if (!children) {
      setLoading(true);
      try {
        const res = await fetch(`/api/recruits/${recruit.id}`);
        if (res.ok) {
          const data = await res.json();
          setChildren(data);
        }
      } finally {
        setLoading(false);
      }
    }
    setExpanded(true);
  }

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            onClick={toggle}
            className="flex h-6 w-6 items-center justify-center rounded text-xs text-black/40 transition hover:bg-black/5"
          >
            {loading ? "…" : expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="inline-block w-6 text-center text-xs text-black/20">·</span>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-foreground)]">
            {recruit.preferredDisplayName ?? recruit.name ?? recruit.email}
          </span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/50">
            {recruit._count.recruits} recruit{recruit._count.recruits === 1 ? "" : "s"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            recruit.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}>
            {recruit.status.toLowerCase()}
          </span>
        </div>
      </div>
      {expanded && children && children.length > 0 && (
        <ul className="ml-6 space-y-1 border-l border-black/10 pl-2">
          {children.map((child) => (
            <RecruitNode key={child.id} recruit={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function RecruitTree({ recruits }: RecruitTreeProps) {
  return (
    <ul className="space-y-1">
      {recruits.map((recruit) => (
        <RecruitNode key={recruit.id} recruit={recruit} />
      ))}
    </ul>
  );
}
