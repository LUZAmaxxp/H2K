'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Users, FileText, AlertTriangle, Calendar, Eye, UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n-context';

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

interface AdminTableProps {
  users: UserData[];
}

interface CheckAdminStatusProps {
  userEmail: string;
  onRoleChange: (userEmail: string, action: 'promote' | 'demote') => void;
}

function CheckAdminStatus({ userEmail, onRoleChange }: CheckAdminStatusProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
   const { t } = useTranslation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: userEmail }),
        });
        const data = await response.json();
        setIsAdmin(data.success || false);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [userEmail]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return isAdmin ? (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => onRoleChange(userEmail, 'demote')}
      className="flex items-center gap-1"
    >
      <UserMinus className="w-3 h-3" />
      {t('admin.remove-admin')}
    </Button>
  ) : (
    <Button
      variant="default"
      size="sm"
      onClick={() => onRoleChange(userEmail, 'promote')}
      className="flex items-center gap-1"
    >
      <UserPlus className="w-3 h-3" />
      {t('admin.make-admin')}
    </Button>
  );
}

export default function AdminTable({ users }: AdminTableProps) {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const handleRoleChange = async (userEmail: string, action: 'promote' | 'demote') => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Role change error:', error);
      toast.error('An error occurred while updating user role');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export?admin=true');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Admin_Records_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Admin export completed successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to export records');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An error occurred during export');
    }
  };

  const getReclamationTypeColor = (type: string) => {
    switch (type) {
      case 'hydraulic': return 'bg-blue-100 text-blue-800';
      case 'electric': return 'bg-yellow-100 text-yellow-800';
      case 'mechanic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.dashboard')}</h2>
          <p className="text-gray-600">{t('admin.manage-users')}</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {t('admin.export-all-data')}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.total-users')}</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.total-interventions')}</CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + user.interventionsCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.total-reclamations')}</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + user.reclamationsCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.active-users-month')}</CardTitle>
            <Calendar className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => {
                if (!user.lastActivity) return false;
                const lastActivity = new Date(user.lastActivity);
                const now = new Date();
                return lastActivity.getMonth() === now.getMonth() &&
                       lastActivity.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users-overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.no-users-found')}</h3>
              <p className="text-gray-600">{t('admin.no-user-data')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[200px]">{t('admin.user')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[100px]">{t('admin.status')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">{t('admin.interventions')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">{t('admin.reclamations')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">{t('admin.total-records')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">{t('admin.last-activity')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[200px]">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                          {user.emailVerified ? t('admin.verified') : t('admin.unverified')}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium">{user.interventionsCount}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium">{user.reclamationsCount}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium">{user.totalRecords}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          {user.lastActivity ? formatDate(user.lastActivity) : t('admin.never')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            {t('admin.view-details')}
                          </Button>
                          <CheckAdminStatus userEmail={user.email} onRoleChange={handleRoleChange} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.name || 'N/A'}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">{t('admin.email-verified')}</label>
                    <p className="text-gray-900">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">{t('admin.joined')}</label>
                    <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">{t('admin.last-activity')}</label>
                    <p className="text-gray-900">{selectedUser.lastActivity ? formatDate(selectedUser.lastActivity) : 'Never'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">{t('admin.total-records')}</label>
                    <p className="text-gray-900">{selectedUser.totalRecords}</p>
                  </div>
                </div>

                {/* Interventions */}
                {selectedUser.interventions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {t('admin.user-interventions')} ({selectedUser.interventions.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedUser.interventions.slice(0, 5).map((intervention, index) => (
                        <div key={index} className="border rounded p-3 bg-blue-50">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>{t('admin.company')}:</strong> {String(intervention.entrepriseName || 'N/A')}</div>
                            <div><strong>{t('admin.site')}:</strong> {String(intervention.siteName || 'N/A')}</div>
                            <div><strong>{t('admin.responsible')}:</strong> {String(intervention.responsable || 'N/A')}</div>
                            <div><strong>{t('admin.start')}:</strong> {formatDate(String(intervention.startDate || ''))}</div>
                            <div><strong>{t('admin.team')}:</strong> {Array.isArray(intervention.teamMembers) ? intervention.teamMembers.join(', ') : 'N/A'}</div>
                            <div><strong>{t('admin.created')}:</strong> {formatDate(String(intervention.createdAt || ''))}</div>
                          </div>
                        </div>
                      ))}
                      {selectedUser.interventions.length > 5 && (
                        <p className="text-sm text-gray-600">{t('admin.and-more', { count: String(selectedUser.interventions.length - 5) })}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reclamations */}
                {selectedUser.reclamations.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      {t('admin.user-reclamations')} ({selectedUser.reclamations.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedUser.reclamations.slice(0, 5).map((reclamation, index) => (
                        <div key={index} className="border rounded p-3 bg-red-50">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>{t('admin.station')}:</strong> {String(reclamation.stationName || 'N/A')}</div>
                            <div><strong>{t('admin.type')}:</strong> <Badge className={`text-xs ${getReclamationTypeColor(String(reclamation.reclamationType || ''))}`}>{String(reclamation.reclamationType || 'N/A')}</Badge></div>
                            <div><strong>{t('admin.date')}:</strong> {formatDate(String(reclamation.date || ''))}</div>
                            <div><strong>{t('admin.description')}:</strong> {String(reclamation.description || '').substring(0, 50)}...</div>
                            <div><strong>{t('admin.created')}:</strong> {formatDate(String(reclamation.createdAt || ''))}</div>
                          </div>
                        </div>
                      ))}
                      {selectedUser.reclamations.length > 5 && (
                        <p className="text-sm text-gray-600">{t('admin.and-more', { count: String(selectedUser.reclamations.length - 5) })}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
