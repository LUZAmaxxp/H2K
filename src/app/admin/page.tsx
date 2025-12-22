'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, AlertCircle, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminTable from '@/components/admin-table';
import SidebarMenu from '@/components/sidebar-menu';
import { authClient } from '@/lib/auth-client';
import { useTranslation } from '@/lib/i18n-context';

// Admin Records Table Component
function AdminRecordsTable({
  records,
  type,
  onDelete
}: {
  records: Record<string, unknown>[];
  type: 'interventions' | 'reclamations';
  onDelete: (id: string, type: 'interventions' | 'reclamations') => void;
}) {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === 'interventions' ? t('admin.all-interventions') : t('admin.all-reclamations')}
          ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">{t('admin.no-records-found')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('table.id')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('table.user')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('table.date')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('table.description')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={String(record._id)} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium">{index + 1}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">
                        {String(
                          (record.userName && record.userName !== 'N/A')
                            ? record.userName
                            : ((record.userId as Record<string, unknown>)?.email || 'N/A')
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(String(record.createdAt))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {String(record.description || record.entrepriseName || 'N/A')}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(String(record._id), type)}
                      >
                        {t('admin.delete')}
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
  );
}


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
  const [activeSection, setActiveSection] = useState<'overview' | 'interventions' | 'reclamations' | 'records' | 'admin'>('admin');
  const [allInterventions, setAllInterventions] = useState<Record<string, unknown>[]>([]);
  const [allReclamations, setAllReclamations] = useState<Record<string, unknown>[]>([]);
  const [currentView, setCurrentView] = useState<'users' | 'interventions' | 'reclamations'>('users');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; type: 'interventions' | 'reclamations' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const fetchAllRecords = useCallback(async () => {
    if (!authenticated || !authorized) return;

    try {
      // Fetch all interventions
      const interventionsResponse = await fetch('/api/interventions?admin=true');
      if (interventionsResponse.ok) {
        const interventionsData = await interventionsResponse.json();
        setAllInterventions(interventionsData.data || []);
      }

      // Fetch all reclamations
      const reclamationsResponse = await fetch('/api/reclamations?admin=true');
      if (reclamationsResponse.ok) {
        const reclamationsData = await reclamationsResponse.json();
        setAllReclamations(reclamationsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching all records:', error);
      toast.error('An error occurred while fetching records');
    }
  }, [authenticated, authorized]);

  const fetchAllAppointments = useCallback(async () => {
    if (!authenticated || !authorized) return;

    try {
      // Fetch all appointments for admin
      const appointmentsResponse = await fetch('/api/appointments?admin=true');
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAllAppointments(appointmentsData || []);
      }
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      toast.error('An error occurred while fetching appointments');
    }
  }, [authenticated, authorized]);

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
      <SidebarMenu activeSection={activeSection} onSectionChange={setActiveSection} />

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
                <CardTitle>All Appointments ({allAppointments.length})</CardTitle>
                <div className="flex justify-end">
                  <Button
                    onClick={() => window.open('/api/appointments?export=docx', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Export All Appointments (DOCX)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {allAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No appointments found</p>
                  </div>
                ) : (
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
                                onClick={() => window.open(`/api/export/appointment/${appointment._id}`, '_blank')}
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
