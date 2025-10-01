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
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
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
              className="data-[slot=sidebar-menu-button]:!p-2 data-[slot=sidebar-menu-button]:!min-h-0"
            >
              <Link href="/" className="flex items-center space-x-3 min-w-0">
                <div className="w-16 h-12 flex items-center justify-center flex-shrink-0">
                  <Image 
                    src="https://i0.wp.com/www.lyzr.ai/wp-content/uploads/2024/11/cropped_lyzr_logo_1.webp?fit=452%2C180&ssl=1" 
                    alt="Lyzr" 
                    width={64}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold leading-tight whitespace-nowrap">HR Candidate</span>
                  <span className="text-sm font-semibold leading-tight whitespace-nowrap">Sourcing Agent</span>
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
