"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Building, User, Loader2, LogOut, Settings, ChevronDown, Boxes } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/lib/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Organization {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  joinedAt: Date;
  organization?: any; // Full organization object
}

export default function OrganizationsPage() {
  const { isAuthenticated, isLoading, userId, email, logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    systemInstruction: ""
  });
  const router = useRouter();

  // Helper function to extract name from email
  const getNameFromEmail = (email: string | null | undefined): string => {
    if (!email) return 'User';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user's organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('org data', data);
          setOrganizations(data.organizations || []);
        } else {
          console.error('Failed to load organizations');
          setOrganizations([]);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    if (userId) {
      loadOrganizations();
    }
  }, [userId]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !createForm.name.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          systemInstruction: createForm.systemInstruction.trim() || undefined,
          createdBy: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new organization to the list
        setOrganizations([
          ...organizations,
          {
            _id: data.organization._id,
            name: data.organization.name,
            role: 'admin',
            joinedAt: new Date(),
          }
        ]);
        setCreateDialogOpen(false);
        setCreateForm({ name: "", systemInstruction: "" });
      } else {
        const error = await response.json();
        alert(`Failed to create organization: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOrganizationSelect = (orgId: string) => {
    // Update user's current organization and navigate to dashboard
    router.push(`/dashboard/ai-assistant?org=${orgId}`);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-sidebar bg-gradient-to-br from-background via-background to-muted/20">
      {/* Supabase-style Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <Image
              src="/lyzr.png"
              alt="Lyzr"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-base">Lyzr HR</span>
              <p className="text-xs text-muted-foreground">Helpdesk</p>
              {/* <Badge variant="secondary" className="text-xs font-medium">AI</Badge> */}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pr-3 pl-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-muted">
                      {getNameFromEmail(email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getNameFromEmail(email)}
                  </p>
                </div>
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Your Organizations</h1>
              {/* <p className="text-muted-foreground">
                Choose an organization to continue to your dashboard
              </p> */}
            </div>
            
            {/* New Organization Button */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New organization
                </Button>
              </DialogTrigger>
              <DialogContent className="xl:max-w-[30%] w-2/3">
                <DialogHeader>
                  <DialogTitle className="text-xl">Create New Organization</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Set up a new organization workspace for your team.
                  </p>
                </DialogHeader>
                <form onSubmit={handleCreateOrganization} className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="org-name-header" className="text-sm font-medium">
                      Organization Name
                    </Label>
                    <Input
                      id="org-name-header"
                      placeholder="e.g., Acme Corporation"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>
                  {/* <div className="space-y-2">
                    <Label htmlFor="system-instruction-header" className="text-sm font-medium">
                      AI Assistant Instructions
                    </Label>
                    <Textarea
                      id="system-instruction-header"
                      placeholder="Optional: Customize how the AI assistant should behave for this organization..."
                      value={createForm.systemInstruction}
                      onChange={(e) => setCreateForm({ ...createForm, systemInstruction: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can always change this later in organization settings.
                    </p>
                  </div> */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isCreating || !createForm.name.trim()}
                      className="min-w-[100px]"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Organization'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {loadingOrgs ? (
            <div className="flex h-full items-center justify-center py-32">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading organizations...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Organizations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {organizations.map((org) => (
                  <Card 
                    key={org._id} 
                    className="group relative bg-card/20 hover:bg-muted/40 overflow-hidden border-border/50 backdrop-blur-sm hover:border-border transition-all duration-200 cursor-pointer"
                    onClick={() => handleOrganizationSelect(org._id)}
                  >
                    <CardContent className="">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Boxes className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-base truncate">
                              {org.name || org.organization?.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {org.role === 'admin' ? 'Administrator' : 
                               org.role === 'manager' ? 'Manager' :
                               org.role === 'resolver' ? 'Resolver' : 'Employee'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={org.role === 'admin' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {org.role}
                        </Badge>
                      </div>
                      
                      {/* <div className="flex items-center text-xs text-muted-foreground">
                        <User className="mr-1 h-3 w-3" />
                        <span>Member since {new Date(org.joinedAt).toLocaleDateString()}</span>
                      </div> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!loadingOrgs && organizations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="p-4 rounded-full bg-muted/50">
                <Building className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No organizations found</h3>
                <p className="text-muted-foreground max-w-md">
                  You haven't joined any organizations yet. Create your first organization to get started with Lyzr HR Helpdesk.
                </p>
              </div>
              <Button 
                size="lg" 
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Organization
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}