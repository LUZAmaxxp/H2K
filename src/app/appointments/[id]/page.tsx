'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  MapPin, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n-context';

interface Appointment {
  _id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  duration: number;
  appointmentType: string;
  room: string;
  status: 'pending' | 'completed' | 'no-show' | 'cancelled';
  medicalNotes?: string;
  specialRequirements?: string;
  therapistId: string;
  patientId: string;
}

export default function AppointmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  const fetchAppointment = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
        setStatus(data.status);
        setMedicalNotes(data.medicalNotes || '');
        setSpecialRequirements(data.specialRequirements || '');
      } else {
        toast.error(t('admin.appointments.not-found'));
        router.push('/dashboard/therapist');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error(t('admin.appointments.not-found'));
    }
  }, [router, t]);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await authClient.getSession();
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        const appointmentId = (await params).id;
        await fetchAppointment(appointmentId);
      } catch (error) {
        console.error('Error initializing:', error);
        toast.error(t('admin.appointments.not-found'));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [params, router, fetchAppointment, t]);

  const handleUpdate = async () => {
    if (!appointment) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          medicalNotes,
          specialRequirements,
        }),
      });

      if (response.ok) {
        const updatedAppointment = await response.json();
        setAppointment(updatedAppointment);
        toast.success(t('admin.appointments.update-success'));
      } else {
        const error = await response.json();
        toast.error(error.error || t('admin.appointments.update-failed'));
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error(t('admin.appointments.update-failed'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no-show': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('admin.appointments.back-dashboard')}
        </Button>

        <div className="grid gap-6">
          {/* Header Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">{t('admin.appointments.details-title')}</CardTitle>
                <CardDescription className="mt-1">
                  {t('table.id')}: {appointment._id}
                </CardDescription>
              </div>
              <Badge className={`px-3 py-1 text-sm font-medium border ${getStatusColor(status)}`}>
                {status.toUpperCase().replace('-', ' ')}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('admin.appointments.patient-name')}</p>
                      <p className="font-semibold">{appointment.patientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('admin.appointments.phone')}</p>
                      <p className="font-semibold">{appointment.patientPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('admin.type')}</p>
                      <p className="font-semibold capitalize">{appointment.appointmentType.replace('-', ' ')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('admin.date')}</p>
                      <p className="font-semibold">
                        {new Date(appointment.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('admin.appointments.time-duration')}</p>
                      <p className="font-semibold">{appointment.time} ({appointment.duration} min)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('admin.appointments.room')}</p>
                      <p className="font-semibold">{appointment.room}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('admin.appointments.manage-title')}</CardTitle>
              <CardDescription>{t('admin.appointments.manage-desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">{t('admin.state')}</Label>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                  disabled={appointment.status === 'completed'}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder={t('admin.appointments.select-status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        {t('status.pending')}
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        {t('status.completed')}
                      </div>
                    </SelectItem>
                    <SelectItem value="no-show">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                        {t('status.no-show')}
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                        {t('status.cancelled')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {status === 'cancelled' && (
                  <p className="text-sm text-red-600 mt-1">
                    {t('admin.appointments.cancel-warning')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical-notes">{t('admin.appointments.medical-notes')}</Label>
                <Textarea
                  id="medical-notes"
                  placeholder={t('admin.appointments.enter-notes')}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special-requirements">{t('admin.appointments.special-requirements')}</Label>
                <Textarea
                  id="special-requirements"
                  placeholder={t('admin.appointments.enter-requirements')}
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button 
                onClick={handleUpdate} 
                disabled={saving || (status === appointment.status && medicalNotes === (appointment.medicalNotes || '') && specialRequirements === (appointment.specialRequirements || ''))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('admin.appointments.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('admin.appointments.save-changes')}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}