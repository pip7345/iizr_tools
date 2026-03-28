import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "btn-gradient text-white",
  secondary:
    "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--border))] hover:bg-[hsl(var(--card-hover))]",
  ghost:
    "bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
  danger: "bg-[hsl(var(--destructive))] text-white hover:opacity-90",
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
