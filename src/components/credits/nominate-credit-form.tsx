"use client";

import { useState } from "react";

import {
  GiveCreditsModal,
  type CreditCategoryOption,
} from "@/components/ui/give-credits-modal";

type Recruit = {
  id: string;
  name: string | null;
  email: string | null;
};

type NominateCreditFormProps = {
  recruits: Recruit[];
  categories: CreditCategoryOption[];
};

export function NominateCreditForm({ recruits, categories }: NominateCreditFormProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-4 rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Nominate credits</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Nominate credits for one of your recruits. Requires admin approval before taking effect.
      </p>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
      >
        Nominate credits
      </button>
      {showModal && (
        <GiveCreditsModal
          recruits={recruits}
          categories={categories}
          isAdmin={false}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
