'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, AlertCircle, Trash2, Users, LogOut, Settings, User, Calendar, BarChart, Home } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminTable from '@/components/admin-table';
import SidebarMenu from '@/components/sidebar-menu';
import { authClient } from '@/lib/auth-client';
import { useTranslation } from '@/lib/i18n-context';

// Admin Records Table Component


interface UserData {
  _id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  interventionsCount: number;
  reclamationsCount: number;
  totalRecords: number;
  lastActivity: string | null;
  interventions: Record<string, unknown>[];
  reclamations: Record<string, unknown>[];
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'appointements' | 'analytics' | 'settings' | 'admin'>('admin');
  const [currentView, setCurrentView] = useState<'users' | 'interventions' | 'reclamations'>('users');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; type: 'interventions' | 'reclamations' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  });
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session && session.data) {
          setAuthenticated(true);
          // Check if user is admin via API
          try {
            const response = await fetch('/api/admin/check-access', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: session.data.user.email }),
            });
            if (response.ok) {
              setAuthorized(true);
            } else {
              toast.error(t('admin.access-denied'));
              router.push('/dashboard');
              return;
            }
          } catch (error) {
            console.error('Admin check failed:', error);
            toast.error(t('admin.no-permission'));
            router.push('/dashboard');
            return;
          }
        } else {
          router.push('/auth/sign-in');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/sign-in');
        return;
      }
    };

    checkAuth();
  }, [router, t]);

  const fetchAdminData = useCallback(async () => {
    if (!authenticated || !authorized) return;

    try {
      const response = await fetch('/api/admin');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else {
        toast.error('Failed to fetch admin data');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [authenticated, authorized, router]);

 

  const fetchAllAppointments = useCallback(async () => {
    if (!authenticated || !authorized) return;

    try {
      const start = new Date(selectedWeekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const qs = new URLSearchParams({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
      if (selectedTherapistId) qs.set('therapistId', selectedTherapistId);
      const appointmentsResponse = await fetch(`/api/appointments?${qs.toString()}`);
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAllAppointments(appointmentsData || []);
      }
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      toast.error('An error occurred while fetching appointments');
    }
  }, [authenticated, authorized, selectedWeekStart, selectedTherapistId]);

  const handleDeleteRecord = useCallback((id: string, type: 'interventions' | 'reclamations') => {
    setRecordToDelete({ id, type });
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteRecord = useCallback(async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/${recordToDelete.type}/${recordToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('admin.delete-success'));
        // Refresh the records
        fetchAllRecords();
      } else {
        toast.error(t('admin.delete-error'));
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error(t('admin.delete-error'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  }, [recordToDelete, t, fetchAllRecords]);

  useEffect(() => {
    if (authenticated && authorized) {
      fetchAdminData();
    }
  }, [authenticated, authorized, fetchAdminData]);

  useEffect(() => {
    if (authenticated && authorized && currentView === 'appointments') {
      fetchAllAppointments();
    }
  }, [authenticated, authorized, currentView, selectedWeekStart, selectedTherapistId, fetchAllAppointments]);

  if (!authenticated || !authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('admin.checking-permissions')}</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.access-denied')}</h3>
                <p className="text-gray-600 text-center mb-4">
                  {t('admin.no-permission')}
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  {t('admin.go-dashboard')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.loading-admin-data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarMenu activeSection={activeSection} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">{t('admin.subtitle')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView('users');
                  setActiveSection('users');
                }}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView('appointments');
                  setActiveSection('appointments');
                  fetchAllAppointments();
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView('appointments');
                  setActiveSection('analytics');
                }}
              >
                <BarChart className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/settings')}
              >
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
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                <Home className="w-4 h-4 mr-2" />
                User Dashboard
              </Button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Button
                variant={currentView === 'users' ? 'default' : 'outline'}
                onClick={() => setCurrentView('users')}
              >
                {t('admin.users')}
              </Button>
              <Button
                variant={currentView === 'appointments' ? 'default' : 'outline'}
                onClick={() => {
                  setCurrentView('appointments');
                  fetchAllAppointments();
                }}
              >
                All Appointments
              </Button>
              <Button
                variant={currentView === 'interventions' ? 'default' : 'outline'}
                onClick={() => {
                  setCurrentView('interventions');
                  fetchAllRecords();
                }}
              >
                {t('admin.all-interventions')}
              </Button>
              <Button
                variant={currentView === 'reclamations' ? 'default' : 'outline'}
                onClick={() => {
                  setCurrentView('reclamations');
                  fetchAllRecords();
                }}
              >
                {t('admin.all-reclamations')}
              </Button>
            </div>
          </div>

          {currentView === 'users' && <AdminTable users={users} />}
          {currentView === 'appointments' && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Appointments ({allAppointments.length})</CardTitle>
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
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
                            {u.name || `${u._id}`}
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={fetchAllAppointments}
                    >
                      Refresh
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        const start = new Date(selectedWeekStart);
                        const end = new Date(start);
                        end.setDate(start.getDate() + 6);
                        const qs = new URLSearchParams({
                          startDate: start.toISOString().split('T')[0],
                          endDate: end.toISOString().split('T')[0],
                          export: 'docx',
                        });
                        if (selectedTherapistId) qs.set('therapistId', selectedTherapistId);
                        window.open(`/api/appointments?${qs.toString()}`, '_blank');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Export Week (DOCX)
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {allAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No appointments found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
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
                          {allAppointments.map((appointment, index) => (
                            <tr key={String(appointment._id)} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="text-sm font-medium">{index + 1}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {String(appointment.therapistName || 'N/A')}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {String(appointment.patientName || 'N/A')}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {appointment.date ? new Date(String(appointment.date)).toLocaleDateString() : 'N/A'}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {String(appointment.time || 'N/A')}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {String(appointment.appointmentType || 'N/A')}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  {String(appointment.status || 'N/A')}
                                </div>
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
                    <div className="mt-8">
                      <Card>
                        <CardHeader>
                          <CardTitle>Appointments by Day</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const start = new Date(selectedWeekStart);
                            const days = Array.from({ length: 7 }).map((_, i) => {
                              const d = new Date(start);
                              d.setDate(start.getDate() + i);
                              const dayStr = d.toISOString().split('T')[0];
                              const count = allAppointments.filter(a => {
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
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          {currentView === 'interventions' && (
            <AdminRecordsTable
              records={allInterventions}
              type="interventions"
              onDelete={handleDeleteRecord}
            />
          )}
          {currentView === 'reclamations' && (
            <AdminRecordsTable
              records={allReclamations}
              type="reclamations"
              onDelete={handleDeleteRecord}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              {t('admin.confirm-delete')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.confirm-delete-message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('admin.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRecord}
              disabled={isDeleting}
            >
              {isDeleting ? t('admin.deleting') : t('admin.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
