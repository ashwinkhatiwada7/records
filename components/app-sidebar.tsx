"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BillIcon,
  BillListIcon,
  ChartSquareIcon,
  GamepadIcon,
  ListIcon,
  UsersGroupRoundedIcon,
  WalletMoneyIcon,
  ShieldUserIcon,
  WalletIcon,
} from "@solar-icons/react/linear";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Pages", href: "/dashboard", icon: BillListIcon, exact: false },
  { title: "Customers", href: "/dashboard/customers", icon: UsersGroupRoundedIcon },
  { title: "Games", href: "/dashboard/games", icon: GamepadIcon },
  { title: "Payment methods", href: "/dashboard/payment-methods", icon: WalletMoneyIcon },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Inside a ledger page the sidebar gains that page's three sections
  const pageId = pathname.match(/^\/dashboard\/pages\/([^/]+)/)?.[1];
  const pageBase = pageId && `/dashboard/pages/${pageId}`;
  const pageItems = pageBase
    ? [
        { title: "Overview", href: pageBase, icon: ChartSquareIcon },
        { title: "Entries", href: `${pageBase}/entries`, icon: ListIcon },
        { title: "Expenses", href: `${pageBase}/expenses`, icon: BillIcon },
      ]
    : [];

  const items =
    user.role === "admin"
      ? [...nav, { title: "Users", href: "/dashboard/users", icon: ShieldUserIcon }]
      : nav;

  // "Pages" owns /dashboard and /dashboard/pages/*; others match by prefix
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname.startsWith("/dashboard/pages")
      : pathname.startsWith(href);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" onClick={() => setOpenMobile(false)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <WalletIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Records</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Payment ledger
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {pageItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>This page</SidebarGroupLabel>
            <SidebarMenu>
              {pageItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive(item.href)}
                >
                  <Link href={item.href} onClick={() => setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
