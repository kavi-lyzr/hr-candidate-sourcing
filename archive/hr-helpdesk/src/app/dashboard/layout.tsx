
"use client";

import { Suspense } from "react";
import AppSidebar from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="w-auto">
      {/* Background gradient overlay */}
      <div 
        id="white-gradient" 
        className="white-gradient w-full h-full transition-all duration-300 fixed top-0 left-0 -z-20"
      />
      <div className="fixed h-full w-full bg-background/20 dark:bg-background/80" />
      {/* <div className="fixed h-full w-full bg-gradient-to-r from-background/80 from-20% via-55% via-transparent to-background/80 to-90%" /> */}
      
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
        <div className="min-h-screen flex relative w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <SiteHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </Suspense>
    </SidebarProvider>
  );
}
