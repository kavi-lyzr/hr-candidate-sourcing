"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Loader2, 
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/lib/AuthProvider";
import { BulkUserImport } from "@/components/bulk-user-import";

interface EditUserData {
  id: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  user?: any;
}

interface EditDepartmentData {
  id: string;
  name: string;
  description?: string;
}

function OrganizationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const orgId = searchParams.get('org');
  
  // Redirect if no organization selected
  useEffect(() => {
    if (!orgId) {
      router.push('/organizations');
    }
  }, [orgId, router]);

  const {
    userRole,
    isAdmin,
    isManager,
    isResolver,
    isEmployee,
    canManageUsers,
    canManageDepartments,
    canViewOrganization,
    users,
    loadingUsers,
    addUser,
    updateUser,
    removeUser,
    departments,
    loadingDepartments,
    addDepartment,
    updateDepartment,
    removeDepartment,
    isLoading,
    error,
  } = useOrganization(orgId || '');

  // State for forms
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    role: '',
    department: ''
  });
  const [addDeptForm, setAddDeptForm] = useState({
    name: '',
    description: ''
  });
  
  // State for dialogs
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<EditUserData | null>(null);
  const [editingDept, setEditingDept] = useState<EditDepartmentData | null>(null);
  
  // State for loading actions
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search and filter state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  // Redirect employees who can't access this page
  useEffect(() => {
    if (!isLoading && userRole === 'employee') {
      router.push('/dashboard');
    }
  }, [userRole, isLoading, router]);

  // Email validation
  const isValidEmail = (email: string) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  // Can add user validation
  const canAddUser = canManageUsers && 
    addUserForm.email.trim() && 
    isValidEmail(addUserForm.email.trim()) && 
    addUserForm.role &&
    !(isManager && addUserForm.role === 'admin');

  // Memoized filtered users with optimized filtering
  const filteredUsers = useMemo(() => {
    if (!userSearch && !roleFilter && !statusFilter) {
      return users; // Return all users if no filters applied
    }

    const searchLower = userSearch.toLowerCase();
    const roleFilterValue = roleFilter === '-' ? null : roleFilter;
    const statusFilterValue = statusFilter === '-' ? null : statusFilter;

    return users.filter(user => {
      // Early return if role or status doesn't match
      if (roleFilterValue && user.role !== roleFilterValue) return false;
      if (statusFilterValue && user.status !== statusFilterValue) return false;
      
      // Only check search if there's a search term
      if (userSearch) {
        const emailMatch = user.email.toLowerCase().includes(searchLower);
        const nameMatch = user.user?.name?.toLowerCase().includes(searchLower) || false;
        if (!emailMatch && !nameMatch) return false;
      }
      
      return true;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  // Memoized filtered departments with optimized filtering
  const filteredDepartments = useMemo(() => {
    if (!deptSearch) {
      return departments; // Return all departments if no search
    }

    const searchLower = deptSearch.toLowerCase();
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchLower)
    );
  }, [departments, deptSearch]);

  // Handle add user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddUser) return;

    setIsAddingUser(true);
    try {
      const success = await addUser(
        addUserForm.email.trim(),
        addUserForm.role,
        addUserForm.department && addUserForm.department !== 'none' ? addUserForm.department : undefined
      );
      
      if (success) {
        setAddUserForm({ email: '', role: '', department: '' });
        setShowAddUserDialog(false);
      }
    } finally {
      setIsAddingUser(false);
    }
  };

  // Handle add department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDeptForm.name.trim() || !canManageDepartments) return;

    setIsAddingDept(true);
    try {
      const success = await addDepartment(
        addDeptForm.name.trim(),
        addDeptForm.description.trim() || undefined
      );
      
      if (success) {
        setAddDeptForm({ name: '', description: '' });
        setShowAddDeptDialog(false);
      }
    } finally {
      setIsAddingDept(false);
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!editingUser || !canManageUsers) return;

    // Prevent managers from editing admins
    if (isManager && editingUser.role === 'admin') return;

    setIsUpdatingUser(true);
    try {
      const success = await updateUser(
        editingUser.id,
        editingUser.role,
        editingUser.department && editingUser.department !== 'none' ? editingUser.department : undefined
      );
      
      if (success) {
        setEditingUser(null);
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Handle edit department
  const handleEditDepartment = async () => {
    if (!editingDept || !canManageDepartments) return;

    setIsUpdatingDept(true);
    try {
      const success = await updateDepartment(
        editingDept.id,
        editingDept.name.trim(),
        editingDept.description?.trim() || undefined
      );
      
      if (success) {
        setEditingDept(null);
      }
    } finally {
      setIsUpdatingDept(false);
    }
  };

  // Handle remove user
  const handleRemoveUser = async (targetUserId: string) => {
    if (!canManageUsers) return;
    
    const user = users.find(u => u._id === targetUserId);
    if (!user) return;
    
    // Prevent managers from removing admins
    if (isManager && user.role === 'admin') return;
    
    if (!confirm(`Are you sure you want to remove ${user.email} from this organization?`)) return;

    setActionLoading(targetUserId);
    try {
      await removeUser(targetUserId);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle remove department
  const handleRemoveDepartment = async (deptId: string) => {
    if (!canManageDepartments) return;
    
    const dept = departments.find(d => d._id === deptId);
    if (!dept) return;
    
    if (dept.userCount > 0) {
      alert(`Cannot delete department "${dept.name}" because it has ${dept.userCount} users assigned to it.`);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete the "${dept.name}" department?`)) return;

    setActionLoading(deptId);
    try {
      await removeDepartment(deptId);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle bulk import
  const handleBulkImport = async (users: any[]) => {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const success = await addUser(
          user.email,
          user.role,
          user.department
        );
        if (success) {
          successCount++;
        } else {
          failureCount++;
          errors.push(`Failed to add ${user.email}`);
        }
      } catch (error) {
        failureCount++;
        errors.push(`Error adding ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (failureCount > 0) {
      throw new Error(`${failureCount} users failed to import. ${errors.join(', ')}`);
    }
  };

  // Memoized user name formatter
  const formatUserName = useCallback((user: any) => {
    if (user?.name) return user.name;
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return emailPrefix
        .replace(/[._]/g, ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Unknown User';
  }, []);

  // Memoized badge variant functions
  const getRoleBadgeVariant = useCallback((role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'resolver': return 'secondary';
      case 'employee': return 'outline';
      default: return 'outline';
    }
  }, []);

  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'invited': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  }, []);

  if (!orgId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80 mt-2" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canViewOrganization && userRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <EyeOff className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view the organization management page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization</h1>
          <p className="text-muted-foreground">Manage users, roles, and departments</p>
        </div>
        <Badge variant={getRoleBadgeVariant(userRole || '')}>
          <Shield className="h-3 w-3 mr-1" />
          {userRole}
        </Badge>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="users" disabled={!canViewOrganization}>
            <Users className="mr-2 h-4 w-4" /> Users & Roles
          </TabsTrigger>
          <TabsTrigger value="departments" disabled={!canViewOrganization}>
            <Building className="mr-2 h-4 w-4" /> Departments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* Add User Card */}
          {canManageUsers && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add New User</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkImportDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-1">
                      <Input
                        type="email"
                        placeholder="user@company.com"
                        value={addUserForm.email}
                        onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                        className={!addUserForm.email.trim() || isValidEmail(addUserForm.email.trim()) 
                          ? '' : 'border-destructive'}
                      />
                      {addUserForm.email.trim() && !isValidEmail(addUserForm.email.trim()) && (
                        <p className="text-sm text-destructive mt-1">Please enter a valid email</p>
                      )}
                    </div>
                    <div className="md:col-span-1">
                      <Select 
                        value={addUserForm.role} 
                        onValueChange={(value) => setAddUserForm(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="resolver">Resolver</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <Select 
                        value={addUserForm.department} 
                        onValueChange={(value) => setAddUserForm(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Department (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1">
                      <Button type="submit" disabled={!canAddUser || isAddingUser} className="w-full">
                        {isAddingUser ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Add User
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="resolver">Resolver</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No users found</h3>
                  <p className="text-sm text-muted-foreground">
                    {userSearch || roleFilter || statusFilter 
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first user"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      {canManageUsers && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.user?.avatar} />
                              <AvatarFallback>
                                {user.user?.name ? user.user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.user ? formatUserName(user.user) : formatUserName({ email: user.email })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const departmentName = user.department ? 
                              departments.find(d => d._id === user.department)?.name || 'Unknown' : 
                              'No department';
                            console.log(`User ${user.email}: department ID ${user.department} -> ${departmentName}`);
                            return user.department ? (
                              <span>{departmentName}</span>
                            ) : (
                              <span className="text-muted-foreground">No department</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.joinedAt ? (
                              new Date(user.joinedAt).toLocaleDateString()
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
                          </div>
                        </TableCell>
                        {canManageUsers && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {/* Cannot edit own role or if manager trying to edit admin */}
                              {user.user?._id !== userId && !(isManager && user.role === 'admin') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setEditingUser({
                                    id: user._id,
                                    email: user.email,
                                    role: user.role,
                                    department: user.department,
                                    status: user.status,
                                    user: user.user
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {/* Cannot remove self or admins if manager */}
                              {user.user?._id !== userId && !(isManager && user.role === 'admin') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRemoveUser(user._id)}
                                  disabled={actionLoading === user._id}
                                >
                                  {actionLoading === user._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          {/* Add Department Card */}
          {canManageDepartments && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Department</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDepartment}>
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <Input
                      placeholder="Department name"
                      className="flex-1"
                      value={addDeptForm.name}
                      onChange={(e) => setAddDeptForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Description (optional)"
                      className="flex-1"
                      value={addDeptForm.description}
                      onChange={(e) => setAddDeptForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <Button 
                      type="submit" 
                      disabled={!addDeptForm.name.trim() || isAddingDept}
                    >
                      {isAddingDept ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add Department
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Department Search */}
          <div className="flex items-center space-x-4 mt-8 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                className="pl-8"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Departments Grid */}
          {loadingDepartments ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No departments found</h3>
              <p className="text-sm text-muted-foreground">
                {deptSearch 
                  ? "Try adjusting your search"
                  : "Get started by creating your first department"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map(dept => (
                <Card key={dept._id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">{dept.name}</CardTitle>
                    {canManageDepartments && (
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingDept({
                            id: dept._id,
                            name: dept.name,
                            description: dept.description
                          })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveDepartment(dept._id)}
                          disabled={actionLoading === dept._id || dept.userCount > 0}
                        >
                          {actionLoading === dept._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mb-2">{dept.description}</p>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-4 w-4" />
                      {dept.userCount} member{dept.userCount !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingUser.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser(prev => 
                    prev ? { ...prev, role: value } : null
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="resolver">Resolver</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select 
                  value={editingUser.department || 'none'} 
                  onValueChange={(value) => setEditingUser(prev => 
                    prev ? { ...prev, department: value === 'none' ? undefined : value } : null
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditUser} disabled={isUpdatingUser}>
                  {isUpdatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={!!editingDept} onOpenChange={() => setEditingDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {editingDept && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={editingDept.name} 
                  onChange={(e) => setEditingDept(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea 
                  value={editingDept.description || ''} 
                  onChange={(e) => setEditingDept(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingDept(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditDepartment} 
                  disabled={isUpdatingDept || !editingDept.name.trim()}
                >
                  {isUpdatingDept && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk User Import Dialog */}
      <BulkUserImport
        isOpen={showBulkImportDialog}
        onClose={() => setShowBulkImportDialog(false)}
        onImport={handleBulkImport}
        departments={departments}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationPageContent />
    </Suspense>
  );
}
