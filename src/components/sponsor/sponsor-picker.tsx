"use client";

import { useState } from "react";

import { selfAssignSponsorAction } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";

type Sponsor = {
  id: string;
  name: string | null;
  email: string | null;
  preferredDisplayName: string | null;
};

type SponsorPickerProps = {
  sponsors: Sponsor[];
};

export function SponsorPicker({ sponsors }: SponsorPickerProps) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = sponsors.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name?.toLowerCase().includes(q) ?? false) ||
      (s.email?.toLowerCase().includes(q) ?? false) ||
      (s.preferredDisplayName?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleSelect(sponsorId: string) {
    setPending(true);
    setMessage(null);

    const result = await selfAssignSponsorAction(sponsorId);

    if (result.status === "error") {
      setMessage({ text: result.message ?? "Failed.", tone: "error" });
    } else {
      setMessage({ text: result.message ?? "Done.", tone: "success" });
    }
    setPending(false);
  }

  return (
    <div className="space-y-4 rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
      <Input
        placeholder="Search sponsors by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {message && <FormMessage message={message.text} tone={message.tone} />}

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">No matching sponsors found.</p>
        ) : (
          filtered.map((sponsor) => (
            <div
              key={sponsor.id}
              className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))/0.5] bg-[hsl(var(--muted))/0.3] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                  {sponsor.preferredDisplayName ?? sponsor.name ?? sponsor.email ?? ""}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{sponsor.email ?? ""}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleSelect(sponsor.id)}
                disabled={pending}
                className="text-xs"
              >
                Select
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
