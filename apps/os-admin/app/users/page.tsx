'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Loader2,
  AlertCircle,
  CheckCircle,
  MoreVertical
} from 'lucide-react';
import { AdminApiClient } from '@/lib/api/admin-client';
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  status: 'active' | 'inactive' | 'suspended' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
  lastLoginAt?: string;
}

export default function UsersPage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await AdminApiClient.getUsers({
        page,
        limit: 20,
        search: search || undefined,
      }) as any;

      setUsers(data?.users || []);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await AdminApiClient.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      await AdminApiClient.updateUser(userId, { status: newStatus });
      toast.success('User status updated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'suspended':
      case 'deleted':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {normalizedStatus === 'suspended' ? 'Suspended' : 'Deleted'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      user: 'bg-blue-100 text-blue-800 border-blue-200',
      contractor: 'bg-orange-100 text-orange-800 border-orange-200',
      manager: 'bg-green-100 text-green-800 border-green-200',
    };
    
    return (
      <Badge className={colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase();
    if (normalized === 'active') return 'active';
    if (normalized === 'suspended') return 'suspended';
    if (normalized === 'deleted') return 'suspended'; // Map deleted to suspended for UI
    return 'inactive';
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage system users, roles, and permissions
              </p>
            </div>
            <Link href="/users/new">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    View and manage all system users
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 w-[300px]"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1); // Reset to first page on search
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchUsers();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="ml-2 text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <Link 
                                    href={`/users/${user.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {user.name}
                                  </Link>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell>
                                <select
                                  value={normalizeStatus(user.status)}
                                  onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                                  className="rounded border p-1 text-sm bg-white hover:bg-gray-50 cursor-pointer"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="suspended">Suspended</option>
                                </select>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {user.lastLoginAt
                                  ? new Date(user.lastLoginAt).toLocaleDateString()
                                  : 'Never'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Link href={`/users/${user.id}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
