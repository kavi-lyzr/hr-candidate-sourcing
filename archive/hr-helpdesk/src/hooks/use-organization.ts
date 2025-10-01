import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthProvider';

export interface OrganizationUser {
  _id: string;
  email: string;
  role: 'employee' | 'resolver' | 'manager' | 'admin';
  status: 'active' | 'invited' | 'inactive';
  department?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  createdBy?: {
    name: string;
    email: string;
  } | null;
  invitedAt: Date;
  joinedAt?: Date;
  createdAt: Date;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseOrganizationReturn {
  // User role and permissions
  userRole: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isResolver: boolean;
  isEmployee: boolean;
  canManageUsers: boolean;
  canManageDepartments: boolean;
  canViewOrganization: boolean;
  
  // Users management
  users: OrganizationUser[];
  loadingUsers: boolean;
  addUser: (email: string, role: string, department?: string) => Promise<boolean>;
  updateUser: (userId: string, role?: string, department?: string) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
  
  // Departments management
  departments: Department[];
  loadingDepartments: boolean;
  addDepartment: (name: string, description?: string) => Promise<boolean>;
  updateDepartment: (id: string, name: string, description?: string) => Promise<boolean>;
  removeDepartment: (id: string) => Promise<boolean>;
  refreshDepartments: () => Promise<void>;
  
  // General
  isLoading: boolean;
  error: string | null;
}

export function useOrganization(organizationId: string): UseOrganizationReturn {
  const { userId } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permission checks
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isResolver = userRole === 'resolver';
  const isEmployee = userRole === 'employee';
  const canManageUsers = isAdmin || isManager;
  const canManageDepartments = isAdmin || isManager;
  const canViewOrganization = userRole !== null && userRole !== 'employee';

  // Fetch users
  const refreshUsers = useCallback(async () => {
    if (!userId || !organizationId) return;
    
    setLoadingUsers(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/users?userId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        if (!userRole && data.userRole) {
          setUserRole(data.userRole);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  }, [userId, organizationId, userRole]);

  // Fetch departments
  const refreshDepartments = useCallback(async () => {
    if (!userId || !organizationId) return;
    
    setLoadingDepartments(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/departments?userId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
        if (!userRole && data.userRole) {
          setUserRole(data.userRole);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch departments');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    } finally {
      setLoadingDepartments(false);
    }
  }, [userId, organizationId, userRole]);

  // Add user
  const addUser = useCallback(async (email: string, role: string, department?: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          department,
          userId,
        }),
      });
      
      if (response.ok) {
        await refreshUsers();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add user');
        return false;
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
      return false;
    }
  }, [userId, organizationId, refreshUsers]);

  // Update user
  const updateUser = useCallback(async (targetUserId: string, role?: string, department?: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/users/${targetUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          department,
          currentUserId: userId,
        }),
      });
      
      if (response.ok) {
        await refreshUsers();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update user');
        return false;
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
      return false;
    }
  }, [userId, organizationId, refreshUsers]);

  // Remove user
  const removeUser = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/users/${targetUserId}?currentUserId=${userId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (response.ok) {
        await refreshUsers();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove user');
        return false;
      }
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user');
      return false;
    }
  }, [userId, organizationId, refreshUsers]);

  // Add department
  const addDepartment = useCallback(async (name: string, description?: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          userId,
        }),
      });
      
      if (response.ok) {
        await refreshDepartments();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add department');
        return false;
      }
    } catch (err) {
      console.error('Error adding department:', err);
      setError('Failed to add department');
      return false;
    }
  }, [userId, organizationId, refreshDepartments]);

  // Update department
  const updateDepartment = useCallback(async (id: string, name: string, description?: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          userId,
        }),
      });
      
      if (response.ok) {
        await refreshDepartments();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update department');
        return false;
      }
    } catch (err) {
      console.error('Error updating department:', err);
      setError('Failed to update department');
      return false;
    }
  }, [userId, organizationId, refreshDepartments]);

  // Remove department
  const removeDepartment = useCallback(async (id: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/departments/${id}?userId=${userId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (response.ok) {
        await refreshDepartments();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove department');
        return false;
      }
    } catch (err) {
      console.error('Error removing department:', err);
      setError('Failed to remove department');
      return false;
    }
  }, [userId, organizationId, refreshDepartments]);

  // Initial load
  useEffect(() => {
    if (userId && organizationId) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([refreshUsers(), refreshDepartments()]);
        setIsLoading(false);
      };
      
      loadData();
    }
  }, [userId, organizationId, refreshUsers, refreshDepartments]);

  return {
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
    refreshUsers,
    departments,
    loadingDepartments,
    addDepartment,
    updateDepartment,
    removeDepartment,
    refreshDepartments,
    isLoading,
    error,
  };
}
