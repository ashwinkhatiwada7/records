import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

const tones = {
  in: {
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glow: "from-emerald-500/10",
  },
  out: {
    chip: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    glow: "from-rose-500/10",
  },
  expense: {
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    glow: "from-amber-500/10",
  },
  profit: {
    chip: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    glow: "from-sky-500/10",
  },
  neutral: {
    chip: "bg-muted text-muted-foreground",
    glow: "from-muted",
  },
};

export function MetricCard({
  label,
  cents,
  value,
  tone,
  icon,
  hint,
}: {
  label: string;
  cents?: number;
  /** Use instead of `cents` for non-money values such as counts */
  value?: string;
  tone: keyof typeof tones;
  icon: React.ReactNode;
  hint?: string;
}) {
  const t = tones[tone];
  const negative = tone === "profit" && (cents ?? 0) < 0;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-xs",
        "bg-gradient-to-br to-transparent",
        t.glow,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5", t.chip)}>
          {icon}
        </div>
      </div>
      <p
        className={cn(
          "mt-3 truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
          negative && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value ?? formatMoney(cents ?? 0)}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
