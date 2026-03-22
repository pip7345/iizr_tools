import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-black/35 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[color:color-mix(in_oklab,var(--color-accent)_20%,white)]",
        className,
      )}
      {...props}
    />
  );
}
