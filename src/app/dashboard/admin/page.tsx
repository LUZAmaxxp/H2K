'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckCircle, XCircle, UserPlus, UserMinus, LogOut, Settings, User, BarChart, Home, Download } from 'lucide-react';
import SidebarMenu from '@/components/sidebar-menu';
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

interface Appointment {
  _id: string;
  therapistName?: string;
  patientName?: string;
  date?: string;
  time?: string;
  appointmentType?: string;
  status?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'appointments' | 'analytics'>('users');
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentSearchParams = new URLSearchParams(window.location.search);
      const tabFromUrl = currentSearchParams.get('tab') as 'users' | 'appointments' | 'analytics';
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }
    }
  }, []);

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
    } catch {
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
  const weekEndDate = useMemo(() => {
    const start = new Date(selectedWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toISOString().split('T')[0];
  }, [selectedWeekStart]);



  const fetchAppointments = async () => {
    try {
      const qs = new URLSearchParams({
        startDate: selectedWeekStart,
        endDate: weekEndDate,
      });
      if (selectedTherapistId) qs.set('therapistId', selectedTherapistId);
      const res = await fetch(`/api/appointments?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  useEffect(() => {
    if (authenticated && activeTab === 'appointments') {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, activeTab, selectedWeekStart, selectedTherapistId]);
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
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarMenu activeSection={activeTab} />
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Hôpital Hassan II - Physiotherapy Department Management
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setActiveTab('users')}>
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('appointments')}>
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('analytics')}>
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => router.push('/profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" onClick={() => router.push('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => router.push('/'),
                    },
                  });
                } catch {
                  router.push('/');
                }
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              User Dashboard
            </Button>
          </div>
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
              <CardTitle>Weekly Appointments ({appointments.length})</CardTitle>
              <CardDescription>View and manage department appointments by week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
                <div className="flex gap-2 items-center">
                  <label className="text-sm text-gray-600">Week start</label>
                  <input
                    type="date"
                    value={selectedWeekStart}
                    onChange={(e) => setSelectedWeekStart(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <label className="text-sm text-gray-600">Therapist</label>
                  <select
                    value={selectedTherapistId}
                    onChange={(e) => setSelectedTherapistId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All</option>
                    {users
                      .filter(u => u.role === 'therapist')
                      .map(u => (
                        <option key={u._id} value={u._id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                  </select>
                  <Button variant="outline" onClick={fetchAppointments}>
                    Refresh
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      const qs = new URLSearchParams({
                        startDate: selectedWeekStart,
                        endDate: weekEndDate,
                        export: 'docx',
                      });
                      if (selectedTherapistId) qs.set('therapistId', selectedTherapistId);
                      window.open(`/api/appointments?${qs.toString()}`, '_blank');
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Week (DOCX)
                  </Button>
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No appointments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Therapist</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Patient</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={String(appointment._id)} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-900">{String(appointment.therapistName || 'N/A')}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-900">{String(appointment.patientName || 'N/A')}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">
                              {appointment.date ? new Date(String(appointment.date)).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">{String(appointment.time || 'N/A')}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">{String(appointment.appointmentType || 'N/A')}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">{String(appointment.status || 'N/A')}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/appointments/${appointment._id}/report`, '_blank')}
                            >
                              Export DOCX
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              {(() => {
                const start = new Date(selectedWeekStart);
                const days = Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(start);
                  d.setDate(start.getDate() + i);
                  const dayStr = d.toISOString().split('T')[0];
                  const count = appointments.filter(a => {
                    const ad = new Date(String(a.date));
                    return ad.toISOString().split('T')[0] === dayStr;
                  }).length;
                  return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), count };
                });
                const max = Math.max(1, ...days.map(d => d.count));
                return (
                  <div className="grid grid-cols-7 gap-2 items-end h-40">
                    {days.map((d, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-end">
                        <div
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: `${(d.count / max) * 100}%` }}
                          title={`${d.label}: ${d.count}`}
                        />
                        <span className="text-xs mt-2 text-gray-600">{d.label}</span>
                        <span className="text-xs text-gray-800">{d.count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
        </div>
        </div>
      </Suspense>
    </div>
  );
}