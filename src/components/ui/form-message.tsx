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
        tone === "error" && "bg-red-50 text-red-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "default" && "bg-black/5 text-black/70",
      )}
    >
      {message}
    </p>
  );
}
