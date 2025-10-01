
'use client';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Ticket, Users, FileText, Settings, LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthProvider";
import Image from "next/image";

interface Organization {
  _id: string;
  name: string;
  role: string;
  organization?: any;
}

const navItems = [
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: Bot,
    href: '/dashboard/ai-assistant',
    roles: ['employee', 'resolver', 'manager', 'admin'],
  },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: Ticket,
    href: '/dashboard/tickets',
    roles: ['employee', 'resolver', 'manager', 'admin'],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Users,
    href: '/dashboard/organization',
    roles: ['manager', 'admin'],
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    icon: FileText,
    href: '/dashboard/knowledge-base',
    roles: ['manager', 'admin'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    roles: ['employee', 'resolver', 'manager', 'admin'],
  },
];

function AppSidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, userId, email } = useAuth();
  const { state } = useSidebar();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string>('employee');

  // Get current org ID from URL parameters
  const currentOrgId = searchParams.get('org');

  // Load current organization from URL params whenever org ID or user changes
  useEffect(() => {
    const loadCurrentOrg = async () => {
      if (!userId || !currentOrgId) return;

      try {
        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const org = data.organizations.find((o: Organization) => o._id === currentOrgId);
          if (org) {
            setCurrentOrg(org);
            setUserRole(org.role);
          }
        }
      } catch (error) {
        console.error('Error loading current organization:', error);
      }
    };

    if (userId && currentOrgId) {
      loadCurrentOrg();
    } else {
      // Clear org state if no org ID in URL
      setCurrentOrg(null);
      setUserRole('employee');
    }
  }, [userId, currentOrgId]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  );

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-border/50 h-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/lyzr.svg"
              alt="Lyzr"
              width={24}
              height={24}
              className="rounded"
            />
            {!isCollapsed && (
              <div>
                <h1 className="font-semibold text-sm text-foreground text-ellipsis">Lyzr HR</h1>
                <p className="text-xs text-muted-foreground text-ellipsis">Helpdesk</p>
              </div>
            )}
          </div>
          <SidebarTrigger className="h-8 w-8 p-0 hover:bg-primary/10" />
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      >
                      {/* className="p-5" */}
                      <Link href={`${item.href}?org=${currentOrgId || ''}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Menu */}
      <SidebarFooter className="border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip={isCollapsed ? "User Menu" : undefined}
                  className="w-full justify-start"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-muted">
                      {email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {currentOrg?.role || 'Member'}
                      </p>
                    </div>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {!isCollapsed && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentOrg?.role || 'Member'}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => router.push(`/dashboard/settings?org=${currentOrgId || ''}`)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppSidebar() {
  return <AppSidebarContent />;
}
