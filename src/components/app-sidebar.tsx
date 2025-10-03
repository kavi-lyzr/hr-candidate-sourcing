"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  IconBookmark,
  IconFileDescription,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsersGroup,
  IconCalendar,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/lib/AuthProvider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "HR Manager",
    email: "hr@lyzr.ai",
    avatar: "",
  },
  navMain: [
    {
      title: "Search Candidates",
      url: "/",
      icon: IconSearch,
    },
    {
      title: "Candidate Matching",
      url: "/candidate-matching",
      icon: IconUsersGroup,
    },
    {
      title: "Saved Profiles",
      url: "/saved-profiles",
      icon: IconBookmark,
    },
    {
      title: "JD Library",
      url: "/jd-library",
      icon: IconFileDescription,
    },
  ],
  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: IconSettings,
    // },
    {
      title: "Book Demo",
      url: "https://www.lyzr.ai/book-demo/",
      icon: IconCalendar,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { displayName, email } = useAuth();
  
  const user = {
    name: displayName || "User",
    email: email || "user@example.com",
    avatar: "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 py-5 data-[slot=sidebar-menu-button]:!min-h-16"
            >
              <Link href="/" className="flex gap-0 items-center min-w-0 rounded-sm">
                <div className="w-8 h-12 flex items-center justify-center flex-shrink-0">
                  <Image 
                    src="/lyzr.png" 
                    alt="Lyzr" 
                    width={32}
                    height={32}
                    className="h-8 w-auto object-contain dark:invert transition-all duration-300"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold leading-tight">Lyzr HR</span>
                  <span className="text-sm font-semibold leading-tight whitespace-nowrap">Candidate Sourcing Agent</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
