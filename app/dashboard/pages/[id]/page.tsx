import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeftDownIcon,
  ArrowRightUpIcon,
  BillIcon,
  ChartIcon,
  CupStarIcon,
  UsersGroupRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { CustomerAvatar } from "@/components/customer-avatar";
import { GameBadges } from "@/components/lists/entries-list";
import { Money } from "@/components/lists/shared";
import { LocalDate } from "@/components/local-date";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPageMetrics, listEntries } from "@/lib/data/queries";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Overview · Records" };

function Rank({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {n}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

async function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [m, recent] = await Promise.all([
    getPageMetrics(id),
    listEntries(id, { q: "", page: 1, pageSize: 6 }),
  ]);
  const base = `/dashboard/pages/${id}`;
  const methodMax = Math.max(1, ...m.byMethod.map((x) => x.totalIn + x.totalOut));

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total in" cents={m.totalIn} tone="in" icon={<ArrowLeftDownIcon />} hint="Payments received" />
        <MetricCard label="Total out" cents={m.totalOut} tone="out" icon={<ArrowRightUpIcon />} hint="Payments sent" />
        <MetricCard label="Expenses" cents={m.totalExpense} tone="expense" icon={<BillIcon />} hint={`${m.expenseCount} recorded`} />
        <MetricCard label="Profit" cents={m.profit} tone="profit" icon={<ChartIcon />} hint="In − out − expenses" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersGroupRoundedIcon className="size-4 text-muted-foreground" /> Top customers
            </CardTitle>
            <CardDescription>Highest money in on this page</CardDescription>
          </CardHeader>
          <CardContent>
            {m.topCustomers.length === 0 ? (
              <Empty>No payments in yet.</Empty>
            ) : (
              <ol className="space-y-3">
                {m.topCustomers.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <Rank n={i + 1} />
                    <CustomerAvatar name={c.name} imageUrl={c.imageUrl} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                    <Money cents={c.totalIn} tone="in" className="text-sm font-semibold" />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CupStarIcon className="size-4 text-muted-foreground" /> Top games
            </CardTitle>
            <CardDescription>Most played. Payments covering several games are split evenly.</CardDescription>
          </CardHeader>
          <CardContent>
            {m.topGames.length === 0 ? (
              <Empty>No games recorded yet.</Empty>
            ) : (
              <ol className="space-y-3">
                {m.topGames.map((g, i) => (
                  <li key={g.id} className="flex items-center gap-3">
                    <Rank n={i + 1} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{g.name}</span>
                    <Badge variant="secondary">
                      {g.plays} {g.plays === 1 ? "play" : "plays"}
                    </Badge>
                    <span className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                      {formatMoney(Math.round(g.totalIn))}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletMoneyIcon className="size-4 text-muted-foreground" /> By payment method
            </CardTitle>
            <CardDescription>Money in and out per method</CardDescription>
          </CardHeader>
          <CardContent>
            {m.byMethod.length === 0 ? (
              <Empty>Nothing yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {m.byMethod.map((x) => (
                  <li key={x.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{x.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        <Money cents={x.totalIn} tone="in" /> in · <Money cents={x.totalOut} tone="out" /> out
                      </span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <div className="bg-emerald-500" style={{ width: `${(x.totalIn / methodMax) * 100}%` }} />
                      <div className="bg-rose-500" style={{ width: `${(x.totalOut / methodMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Latest entries</CardTitle>
            <CardDescription>
              <Link href={`${base}/entries`} className="text-primary hover:underline">
                See all {m.entryCount} entries
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.rows.length === 0 ? (
              <Empty>No entries yet.</Empty>
            ) : (
              <ul className="divide-y">
                {recent.rows.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <CustomerAvatar name={r.customerName} imageUrl={r.customerImageUrl} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{r.customerName}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <LocalDate value={r.createdAt} withTime />
                        <span>· {r.methodName}</span>
                        <span>· by {r.addedBy}</span>
                      </div>
                      {r.gameNames.length > 0 && <GameBadges names={r.gameNames} />}
                    </div>
                    <Money
                      cents={r.amountCents}
                      tone={r.type}
                      className="text-sm font-semibold"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/60" />}>
      <Overview params={params} />
    </Suspense>
  );
}
