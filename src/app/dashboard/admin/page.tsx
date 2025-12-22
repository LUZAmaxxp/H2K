'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckCircle, XCircle, UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  userId: string;
  email: string;
  role: 'therapist' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  specialization?: string;
  totalAppointments: number;
  appointmentCount: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'appointments' | 'analytics'>('users');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session) {
          const profileResponse = await fetch('/api/user-profile');
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            if (profile.role !== 'admin') {
              router.push('/dashboard/therapist');
              return;
            }
            setAuthenticated(true);
            await fetchUsers();
          } else {
            router.push('/auth/sign-in');
          }
        } else {
          router.push('/auth/sign-in');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/sign-in');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      if (response.ok) {
        toast.success(`User ${action}d successfully`);
        await fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeTherapists = users.filter(u => u.role === 'therapist' && (u.status === 'approved' || u.status === 'active'));
  const totalAppointments = users.reduce((sum, u) => sum + u.appointmentCount, 0);

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Hôpital Hassan II - Physiotherapy Department Management
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Users className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Therapists</CardTitle>
              <UserPlus className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeTherapists.length}</div>
              <p className="text-xs text-gray-500 mt-1">Approved therapists</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-gray-500 mt-1">All users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalAppointments}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage therapists and administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Role</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Appointments</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.licenseNumber && (
                            <div className="text-sm text-gray-500">
                              License: {user.licenseNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4">{user.appointmentCount}</td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            {user.status === 'pending' && user.role === 'therapist' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(user.userId, 'approve')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(user.userId, 'reject')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {user.role === 'therapist' && (user.status === 'approved' || user.status === 'active') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(user.userId, 'promote')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Promote to Admin
                              </Button>
                            )}
                            {user.role === 'admin' && user.userId !== users.find(u => u.email === user.email)?.userId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(user.userId, 'demote')}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                Remove Admin
                              </Button>
                            )}
                            {user.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(user.userId, 'deactivate')}
                                className="text-red-600 hover:text-red-700"
                              >
                                Deactivate
                              </Button>
                            )}
                            {user.status === 'inactive' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserAction(user.userId, 'activate')}
                                className="text-green-600 hover:text-green-700"
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>View and manage all department appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Appointment overview coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                This will include a calendar view and appointment management interface.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Department statistics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                This will include charts for appointment trends, therapist performance, and room utilization.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

