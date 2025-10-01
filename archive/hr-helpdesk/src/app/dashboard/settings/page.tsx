
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Building2, Users, Calendar, Trash2, LogOut, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface OrganizationDetails {
  organization: {
    _id: string;
    name: string;
    avatar?: string;
    createdAt: string;
  };
  membership: {
    role: string;
    status: string;
    joinedAt?: string;
  };
  isCreator: boolean;
}

function SettingsPageContent() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (orgId && userId) {
      fetchOrganizationDetails();
    }
  }, [orgId, userId]);

  const fetchOrganizationDetails = async () => {
    try {
      const response = await fetch(`/api/v1/organizations/${orgId}/details?userId=${userId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'internal-api-key-change-in-production',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizationDetails(data);
      } else {
        toast.error('Failed to load organization details');
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!orgId || !userId) return;
    
    setActionLoading('leave');
    try {
      const response = await fetch(`/api/v1/organizations/${orgId}/leave?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'internal-api-key-change-in-production',
        },
      });

      if (response.ok) {
        toast.success('Successfully left the organization');
        router.push('/organizations');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to leave organization');
      }
    } catch (error) {
      console.error('Error leaving organization:', error);
      toast.error('Failed to leave organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!orgId || !userId) return;
    
    setActionLoading('delete');
    try {
      const response = await fetch(`/api/v1/organizations/${orgId}/delete?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'internal-api-key-change-in-production',
        },
      });

      if (response.ok) {
        toast.success('Organization deleted successfully');
        router.push('/organizations');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organizationDetails) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Failed to load organization details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organization, membership, isCreator } = organizationDetails;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization settings</p>
      </div>

      {/* Organization Information */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> 
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {organization.avatar ? (
              <img
                src={organization.avatar}
                alt={organization.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{organization.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{membership.role}</Badge>
                {isCreator && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Creator
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(organization.createdAt).toLocaleDateString()}</span>
            </div>
            {membership.joinedAt && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span>{new Date(membership.joinedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}

      {/* Organization Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Leave Organization</h4>
            <p className="text-sm text-muted-foreground">
              Leave this organization. You will lose access to all organization resources.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:border-destructive hover:text-destructive-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Organization
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Organization</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave "{organization.name}"? This action cannot be undone.
                    You will lose access to all organization resources and will need to be re-invited to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveOrganization}
                    disabled={actionLoading === 'leave'}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {actionLoading === 'leave' ? 'Leaving...' : 'Leave Organization'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isCreator && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Delete Organization</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all its data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Organization
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Organization
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you absolutely sure you want to delete "{organization.name}"? This will:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Permanently delete the organization</li>
                          <li>Remove all users from the organization</li>
                          <li>Delete all tickets, messages, and data</li>
                          <li>This action cannot be undone</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteOrganization}
                        disabled={actionLoading === 'delete'}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {actionLoading === 'delete' ? 'Deleting...' : 'Delete Organization'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
