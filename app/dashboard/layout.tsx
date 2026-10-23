import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireSession } from "@/lib/session";

async function Shell({ children }: { children: React.ReactNode }) {
  // Authoritative check; proxy.ts only looks for the cookie
  const { user } = await requireSession();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          user={{ name: user.name, email: user.email, role: user.role ?? "user" }}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <span className="text-sm font-medium text-muted-foreground">Records</span>
          </header>
          <div className="mx-auto w-full max-w-6xl flex-1 p-4 pb-40 md:p-6">{children}</div>
          <BottomNav role={user.role ?? "user"} />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <Shell>{children}</Shell>
    </Suspense>
  );
}
