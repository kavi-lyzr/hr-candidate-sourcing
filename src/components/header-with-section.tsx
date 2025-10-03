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
    <div className="flex h-14 items-center gap-3 border-b px-4 sticky top-0 z-10 bg-background">
      <SidebarTrigger />
      <div className="h-4 w-px bg-gray-300" />
      <h1 className="text-sm font-medium text-foreground">{sectionName}</h1>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <ThemeSwitcher />
        {isAuthenticated ? (
          <Button variant="outline" onClick={logout}>Logout</Button>
        ) : (
          <Button onClick={login}>Login</Button>
        )}
      </div>
    </div>
  );
}