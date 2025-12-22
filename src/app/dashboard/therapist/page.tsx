'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SidebarMenu from '@/components/sidebar-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Users, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n-context';
import { cn } from '@/lib/utils';

interface Appointment {
  _id: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  appointmentType: string;
  room: string;
  status: 'pending' | 'completed' | 'no-show' | 'cancelled';
  medicalNotes?: string;
}

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  status: string;
  totalAppointments: number;
}

export default function TherapistDashboard() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [authenticated, setAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session) {
          setAuthenticated(true);
          await fetchUserProfile();
          await fetchAppointments();
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

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user-profile');
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);

        // Check if account is approved
        if (profile.status === 'pending') {
          router.push('/auth/pending-approval');
          return;
        }
      } else if (response.status === 404) {
        // Profile doesn't exist - redirect to sign-up
        router.push('/auth/sign-up');
        return;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // On error, redirect to sign-up
      router.push('/auth/sign-up');
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else if (response.status === 401) {
        router.push('/auth/sign-in');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(t('therapist.export-failed'));
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchAppointments();
    }
  }, [selectedDate, authenticated]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/appointments?date=${selectedDate}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appointments_${selectedDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t('therapist.export-success'));
      }
    } catch (error) {
      toast.error(t('therapist.export-failed'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCardBorderColor = (status: string | undefined) => {
    if (!status) return 'border-gray-200';
    switch (status) {
      case 'completed': return 'border-green-300';
      case 'pending': return 'border-blue-300';
      case 'no-show': return 'border-yellow-300';
      case 'cancelled': return 'border-red-300';
      default: return 'border-gray-200';
    }
  };

  // Generate time slots (8:00 AM - 8:00 PM, hourly)
  const timeSlots = [];
  for (let hour = 8; hour < 20; hour++) {
    timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  // Get appointment for a specific time slot
  const getAppointmentForSlot = (time: string) => {
    return appointments.find(apt => apt.time === time);
  };

  // Count appointments by status
  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    noShow: appointments.filter(a => a.status === 'no-show').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarMenu />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('therapist.welcome')}, {userProfile?.firstName} {userProfile?.lastName}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {t('therapist.subtitle')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('therapist.todays-appointments')}</CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}/12</div>
              <p className="text-xs text-gray-500 mt-1">{t('therapist.max-per-day')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('therapist.completed')}</CardTitle>
              <Clock className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('therapist.pending')}</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('therapist.no-show')}</CardTitle>
              <Users className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.noShow}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('therapist.total')}</CardTitle>
              <FileText className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile?.totalAppointments || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{t('therapist.all-time')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Selector and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">
              {new Date(selectedDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (stats.total >= 12) {
                  toast.error(t('therapist.limit-reached'));
                  router.push('/appointments/waiting-list');
                } else {
                  router.push('/appointments/new');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('therapist.new-appointment')}
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Daily Appointments Grid */}
        <Card>
          <CardHeader>
            <CardTitle>{t('therapist.daily-schedule')}</CardTitle>
            <CardDescription>
              {t('therapist.slots-booked')
                .replace('{booked}', String(stats.total))
                .replace('{total}', '12')
                .replace('{date}', new Date(selectedDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-US'))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {timeSlots.map((time) => {
                const appointment = getAppointmentForSlot(time);
                const isAvailable = !appointment;

                return (
                  <div
                    key={time}
                    className={cn(
                      "border-2 rounded-lg p-4 transition-all cursor-pointer",
                      isAvailable
                        ? "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        : `${getCardBorderColor(appointment?.status)} bg-white hover:shadow-md`
                    )}
                    onClick={() => {
                      if (appointment) {
                        router.push(`/appointments/${appointment._id}`);
                      } else if (stats.total < 12) {
                        router.push(`/appointments/new?date=${selectedDate}&time=${time}`);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{time}</span>
                      {appointment && (
                        <Badge className={getStatusColor(appointment.status)}>
                          {t(`admin.status.${appointment.status}`)}
                        </Badge>
                      )}
                    </div>
                    {appointment ? (
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{appointment.patientName}</p>
                        <p className="text-sm text-gray-600">
                          {t(`admin.appointments.types.${appointment.appointmentType}`) !== `admin.appointments.types.${appointment.appointmentType}` 
                            ? t(`admin.appointments.types.${appointment.appointmentType}`) 
                            : appointment.appointmentType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('therapist.room')} {appointment.room} • {appointment.duration} {t('therapist.min')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">{t('therapist.available')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

