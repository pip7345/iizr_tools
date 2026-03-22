import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-[0_10px_30px_rgba(212,86,39,0.28)] hover:bg-[var(--color-accent-strong)]",
  secondary:
    "bg-white text-[var(--color-foreground)] ring-1 ring-black/10 hover:bg-[var(--color-surface)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-black/5",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
