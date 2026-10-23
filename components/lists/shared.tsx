import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

export function Money({
  cents,
  tone,
  className,
}: {
  cents: number;
  tone?: "in" | "out" | "profit";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        tone === "in" && "text-emerald-600 dark:text-emerald-400",
        tone === "out" && "text-rose-600 dark:text-rose-400",
        tone === "profit" &&
          (cents >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"),
        className,
      )}
    >
      {formatMoney(cents)}
    </span>
  );
}

export function StatusBadge({ status }: { status: "open" | "closed" }) {
  return status === "open" ? (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Open</Badge>
  ) : (
    <Badge variant="secondary">Closed</Badge>
  );
}

export function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}
