"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BillIcon,
  BillListIcon,
  ChartSquareIcon,
  GamepadIcon,
  ListIcon,
  ShieldUserIcon,
  UsersGroupRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { cn } from "@/lib/utils";

/**
 * Phone-only bottom navigation (the sidebar covers md and up).
 * Always shows the app menu. Inside a ledger page a second bar sits on top of it
 * with that page's sections: Overview, Entries, Expenses.
 */
export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const pageId = pathname.match(/^\/dashboard\/pages\/([^/]+)/)?.[1];
  const base = pageId && `/dashboard/pages/${pageId}`;

  const appItems = [
    { title: "Pages", href: "/dashboard", icon: BillListIcon },
    { title: "Customers", href: "/dashboard/customers", icon: UsersGroupRoundedIcon },
    { title: "Games", href: "/dashboard/games", icon: GamepadIcon },
    { title: "Payments", href: "/dashboard/payment-methods", icon: WalletMoneyIcon },
    ...(role === "admin"
      ? [{ title: "Users", href: "/dashboard/users", icon: ShieldUserIcon }]
      : []),
  ];
  const pageItems = base
    ? [
        { title: "Overview", href: base, icon: ChartSquareIcon },
        { title: "Entries", href: `${base}/entries`, icon: ListIcon },
        { title: "Expenses", href: `${base}/expenses`, icon: BillIcon },
      ]
    : [];

  const appActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname.startsWith("/dashboard/pages")
      : pathname.startsWith(href);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
      {pageItems.length > 0 && (
        <nav
          aria-label="Page sections"
          className="grid grid-cols-3 gap-1 border-b bg-muted/40 p-1.5"
        >
          {pageItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground active:bg-muted",
                )}
              >
                <item.icon className="size-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      )}
      <nav
        aria-label="Main"
        className="grid pb-[env(safe-area-inset-bottom)]"
        style={{ gridTemplateColumns: `repeat(${appItems.length}, minmax(0, 1fr))` }}
      >
        {appItems.map((item) => {
          const active = appActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-6" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
