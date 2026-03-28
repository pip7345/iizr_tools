import { cn } from "@/lib/utils";

type FormMessageProps = {
  message?: string;
  tone?: "default" | "error" | "success";
};

export function FormMessage({ message, tone = "default" }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-2xl px-4 py-3 text-sm",
        tone === "error" && "bg-red-500/20 text-red-400",
        tone === "success" && "bg-emerald-500/20 text-emerald-400",
        tone === "default" && "bg-[hsl(var(--muted))/0.5] text-[hsl(var(--foreground))]",
      )}
    >
      {message}
    </p>
  );
}
