import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-black/35 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[color:color-mix(in_oklab,var(--color-accent)_20%,white)]",
        className,
      )}
      {...props}
    />
  );
}
