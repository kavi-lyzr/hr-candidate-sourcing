'use client'

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function HeaderWithSection() {
  const pathname = usePathname();
  const { isAuthenticated, login, logout } = useAuth();

  const getSectionName = (path: string) => {
    return path.split("/").pop() || "Home";
  };

  const sectionName = getSectionName(pathname);

  return (
    <div className="flex h-14 items-center gap-2 sm:gap-3 border-b px-2 sm:px-4 sticky top-0 z-10 bg-background">
      <SidebarTrigger />
      <div className="h-4 w-px bg-gray-300 hidden sm:block" />
      <h1 className="text-xs sm:text-sm font-medium text-foreground truncate flex-1 sm:flex-none capitalize">
        {sectionName}
      </h1>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <ThemeSwitcher />
        {isAuthenticated ? (
          <Button variant="outline" size="sm" onClick={logout} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>
        ) : (
          <Button size="sm" onClick={login} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Login</span>
            <span className="sm:hidden">In</span>
          </Button>
        )}
      </div>
    </div>
  );
}