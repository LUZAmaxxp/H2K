'use client';



import { useCallback, useEffect, useState, Suspense } from 'react';

import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ArrowLeft, Search, CheckCircle, XCircle, User, Calendar, Clock, MapPin } from 'lucide-react';

import toast from 'react-hot-toast';

import { useTranslation } from '@/lib/i18n-context';



interface Patient {
  _id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
}

const appointmentTypeDurations: Record<string, number> = {
  'initial-assessment': 60,
  'follow-up': 45,
  'rehabilitation': 30,
  'post-operative': 60
};



export default function NewAppointmentPage() {

  const router = useRouter();

  const { t } = useTranslation();

  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [patients, setPatients] = useState<Patient[]>([]);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  const [isAvailable, setIsAvailable] = useState(false);

  const [availabilityMessage, setAvailabilityMessage] = useState('');



  // Form data

  const [formData, setFormData] = useState({

    date: new Date().toISOString().split('T')[0],

    time: '08:00',

    duration: 45,

    appointmentType: 'follow-up',

    room: 'Room 1',

    medicalNotes: '',

    specialRequirements: ''

  });



  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentSearchParams = new URLSearchParams(window.location.search);
      setFormData(prev => ({
        ...prev,
        date: currentSearchParams.get('date') || prev.date,
        time: currentSearchParams.get('time') || prev.time,
      }));
    }
  }, []);
  



  

  const [newPatientData, setNewPatientData] = useState({

    medicalRecordNumber: '',

    firstName: '',

    lastName: '',

    dateOfBirth: '',

    phoneNumber: '',

    email: '',

    insuranceProvider: '',

    insuranceNumber: ''

  });



  useEffect(() => {

    const checkAuth = async () => {

      try {

        const session = await authClient.getSession();

        if (!session) {

          router.push('/auth/sign-in');

        }

    } catch (error) {

      console.error('Auth check failed:', error);

      router.push('/auth/sign-in');

    }

    };

    checkAuth();

  }, [router]);



  const searchPatients = useCallback(async () => {

    if (!searchQuery.trim()) {

      setPatients([]);

      return;

    }



    try {

      const response = await fetch(`/api/patients?q=${encodeURIComponent(searchQuery)}`);

      if (response.ok) {

        const data = await response.json();

        setPatients(data);

      }

    } catch (error) {

      console.error('Error searching patients:', error);

    }

  }, [searchQuery]);



  useEffect(() => {

    const debounceTimer = setTimeout(() => {

      searchPatients();

    }, 300);



    return () => clearTimeout(debounceTimer);

  }, [searchQuery, searchPatients]);



  const createNewPatient = async () => {

    try {

      const response = await fetch('/api/patients', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(newPatientData)

      });



      if (response.ok) {

        const patient = await response.json();

        setSelectedPatient(patient);

        setShowNewPatientForm(false);

        toast.success(t('admin.appointments.patient-created'));

        setStep(2);

      } else {

        const error = await response.json();

        toast.error(error.error || t('admin.appointments.failed-create-patient'));

      }

    } catch (error) {

      console.error('Error creating patient:', error);

      toast.error(t('admin.appointments.failed-create-patient'));

    }

  };



  const checkAvailability = async () => {

    setLoading(true);

    try {

      const response = await fetch(

        `/api/availability?date=${formData.date}&time=${formData.time}&duration=${formData.duration}&room=${formData.room}`

      );



      if (response.ok) {

        const data = await response.json();

        setIsAvailable(data.isAvailable);

        setAvailabilityMessage(data.message || '');

        setAvailabilityChecked(true);



        if (!data.isAvailable) {

          toast.error(data.message || t('admin.appointments.slot-not-available'));

        }

      }

    } catch (error) {

      console.error('Error checking availability:', error);

      toast.error(t('admin.appointments.failed-check-availability'));

    } finally {

      setLoading(false);

    }

  };



  const handleSubmit = async () => {

    if (!selectedPatient) {

      toast.error(t('admin.appointments.please-select-patient'));

      return;

    }



    if (!availabilityChecked || !isAvailable) {

      toast.error(t('admin.appointments.please-check-availability'));

      return;

    }



    setLoading(true);

    try {

      const response = await fetch('/api/appointments', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          patientId: selectedPatient._id,

          ...formData

        })

      });



      if (response.ok) {

        toast.success(t('admin.appointments.success-create'));

        router.push('/dashboard/therapist');

      } else {

        const error = await response.json();

        toast.error(error.error || t('admin.appointments.failed-create-appointment'));

      }

    } catch (error) {

      console.error('Error creating appointment:', error);

      toast.error(t('admin.appointments.failed-create-appointment'));

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    setFormData(prev => ({

      ...prev,

      duration: appointmentTypeDurations[prev.appointmentType] || 45

    }));

  }, [formData.appointmentType]);



  const getStepTitle = (stepNumber: number) => {

    switch (stepNumber) {

      case 1: return t('admin.appointments.steps.patient-selection');

      case 2: return t('admin.appointments.steps.appointment-details');

      case 3: return t('admin.appointments.steps.room-availability');

      case 4: return t('admin.appointments.steps.confirmation');

      default: return '';

    }

  };



  const getStepIcon = (stepNumber: number) => {

    switch (stepNumber) {

      case 1: return User;

      case 2: return Calendar;

      case 3: return MapPin;

      case 4: return CheckCircle;

      default: return User;

    }

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 sm:p-6 lg:p-8">

      {/* Background Effects */}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>

        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-100/30 rounded-full blur-3xl"></div>

      </div>



          <Suspense fallback={<div>Loading...</div>}>
              <div className="max-w-5xl mx-auto relative z-10">
        <Button

          variant="ghost"

          onClick={() => router.back()}

          className="mb-6 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"

        >

          <ArrowLeft className="w-4 h-4 mr-2" />

          {t('admin.appointments.back')}

        </Button>



        {/* Progress Steps */}

        <div className="mb-8">

          <div className="flex items-center justify-between">

            {[1, 2, 3, 4].map((stepNum) => {

              const StepIcon = getStepIcon(stepNum);

              const isCompleted = step > stepNum;

              const isCurrent = step === stepNum;

              

              return (

                <div key={stepNum} className="flex items-center flex-1">

                  <div className="flex flex-col items-center relative">

                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${

                      isCompleted 

                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200' 

                        : isCurrent 

                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-200 scale-110' 

                        : 'bg-white border-2 border-gray-200'

                    }`}>

                      {isCompleted ? (

                        <CheckCircle className="w-6 h-6 text-white" />

                      ) : (

                        <StepIcon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />

                      )}

                    </div>

                    <span className={`text-xs mt-2 font-medium absolute top-14 whitespace-nowrap ${

                      isCurrent ? 'text-blue-700' : 'text-gray-500'

                    }`}>

                      {getStepTitle(stepNum)}

                    </span>

                  </div>

                  {stepNum < 4 && (

                    <div className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${

                      step > stepNum 

                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 

                        : 'bg-gray-200'

                    }`} />

                  )}

                </div>

              );

            })}

          </div>

        </div>



        <Card className="border-2 border-blue-100 shadow-2xl shadow-blue-100/50 bg-white/80 backdrop-blur-sm">

          <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">

            <CardTitle className="text-2xl text-gray-900">{t('admin.appointments.new-appointment')}</CardTitle>

            <CardDescription className="text-gray-600">

              {t('admin.appointments.step-indicator', { step: String(step), title: getStepTitle(step) })}

            </CardDescription>

          </CardHeader>

          <CardContent className="pt-6">

            {/* Step 1: Patient Selection */}

            {step === 1 && (

              <div className="space-y-6 animate-fade-in">

                <div>

                  <Label className="text-gray-700 font-semibold">{t('admin.appointments.search-patient')}</Label>

                  <div className="flex gap-2 mt-2">

                    <div className="relative flex-1">

                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />

                      <Input

                        type="text"

                        placeholder={t('admin.appointments.search-placeholder')}

                        value={searchQuery}

                        onChange={(e) => setSearchQuery(e.target.value)}

                        className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"

                      />

                    </div>

                  </div>

                </div>



                {patients.length > 0 && (

                  <div className="space-y-2">

                    <Label className="text-gray-700 font-semibold">{t('admin.appointments.select-patient')}</Label>

                    <div className="border-2 border-blue-100 rounded-xl divide-y divide-blue-100 max-h-60 overflow-y-auto">

                      {patients.map((patient) => (

                        <div

                          key={patient._id}

                          onClick={() => {

                            setSelectedPatient(patient);

                            setStep(2);

                          }}

                          className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 cursor-pointer transition-all duration-200 group"

                        >

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-200">

                              {patient.firstName[0]}{patient.lastName[0]}

                            </div>

                            <div className="flex-1">

                              <div className="font-semibold text-gray-900">

                                {patient.firstName} {patient.lastName}

                              </div>

                              <div className="text-sm text-gray-600">

                                {t('admin.appointments.mr-number')}: {patient.medicalRecordNumber} • {patient.phoneNumber}

                              </div>

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                )}



                <div className="border-t-2 border-blue-100 pt-6">

                  <Button

                    variant="outline"

                    onClick={() => setShowNewPatientForm(!showNewPatientForm)}

                    className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"

                  >

                    {showNewPatientForm ? t('admin.appointments.cancel') : t('admin.appointments.add-new-patient')}

                  </Button>



                  {showNewPatientForm && (

                    <div className="mt-4 space-y-4 p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 animate-fade-in">

                      <div className="grid grid-cols-2 gap-4">

                        <div>

                          <Label className="text-gray-700 font-semibold">{t('admin.appointments.mrn')} *</Label>

                          <Input

                            value={newPatientData.medicalRecordNumber}

                            onChange={(e) => setNewPatientData({ ...newPatientData, medicalRecordNumber: e.target.value })}

                            className="border-blue-200 focus:border-blue-400"

                          />

                        </div>

                        <div>

                          <Label className="text-gray-700 font-semibold">{t('admin.appointments.dob')} *</Label>

                          <Input

                            type="date"

                            value={newPatientData.dateOfBirth}

                            onChange={(e) => setNewPatientData({ ...newPatientData, dateOfBirth: e.target.value })}

                            className="border-blue-200 focus:border-blue-400"

                          />

                        </div>

                      </div>

                      <div className="grid grid-cols-2 gap-4">

                        <div>

                          <Label className="text-gray-700 font-semibold">{t('admin.appointments.first-name')} *</Label>

                          <Input

                            value={newPatientData.firstName}

                            onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}

                            className="border-blue-200 focus:border-blue-400"

                          />

                        </div>

                        <div>

                          <Label className="text-gray-700 font-semibold">{t('admin.appointments.last-name')} *</Label>

                          <Input

                            value={newPatientData.lastName}

                            onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}

                            className="border-blue-200 focus:border-blue-400"

                          />

                        </div>

                      </div>

                      <div>

                        <Label className="text-gray-700 font-semibold">{t('admin.appointments.phone')} *</Label>

                        <Input

                          value={newPatientData.phoneNumber}

                          onChange={(e) => setNewPatientData({ ...newPatientData, phoneNumber: e.target.value })}

                          className="border-blue-200 focus:border-blue-400"

                        />

                      </div>

                      <Button 

                        onClick={createNewPatient} 

                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-300/50"

                      >

                        {t('admin.appointments.create-patient')}

                      </Button>

                    </div>

                  )}

                </div>

              </div>

            )}



            {/* Step 2: Appointment Details */}

            {step === 2 && (

              <div className="space-y-6 animate-fade-in">

                {selectedPatient && (

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 shadow-lg shadow-blue-100/50">

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">

                        {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}

                      </div>

                      <div>

                        <div className="font-bold text-gray-900">{t('admin.appointments.selected-patient')}</div>

                        <div className="text-lg font-semibold text-blue-700">

                          {selectedPatient.firstName} {selectedPatient.lastName}

                        </div>

                        <div className="text-sm text-gray-600">

                          {t('admin.appointments.mr-number')}: {selectedPatient.medicalRecordNumber}

                        </div>

                      </div>

                    </div>

                  </div>

                )}



                <div className="grid grid-cols-2 gap-6">

                  <div>

                    <Label className="text-gray-700 font-semibold flex items-center gap-2">

                      <Calendar className="w-4 h-4 text-blue-500" />

                      {t('admin.appointments.date')} *

                    </Label>

                    <Input

                      type="date"

                      value={formData.date}

                      onChange={(e) => {

                        setFormData({ ...formData, date: e.target.value });

                        setAvailabilityChecked(false);

                      }}

                      min={new Date().toISOString().split('T')[0]}

                      className="mt-2 border-blue-200 focus:border-blue-400"

                    />

                  </div>

                  <div>

                    <Label className="text-gray-700 font-semibold flex items-center gap-2">

                      <Clock className="w-4 h-4 text-blue-500" />

                      {t('admin.appointments.time')} *

                    </Label>

                    <Select

                      value={formData.time}

                      onValueChange={(value) => {

                        setFormData({ ...formData, time: value });

                        setAvailabilityChecked(false);

                      }}

                    >

                      <SelectTrigger className="mt-2 border-blue-200">

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        {Array.from({ length: 12 }, (_, i) => {

                          const hour = i + 8;

                          return (

                            <SelectItem key={hour} value={`${String(hour).padStart(2, '0')}:00`}>

                              {hour}:00

                            </SelectItem>

                          );

                        })}

                      </SelectContent>

                    </Select>

                  </div>

                </div>



                <div className="grid grid-cols-2 gap-6">

                  <div>

                    <Label className="text-gray-700 font-semibold">{t('admin.appointments.appointment-type')} *</Label>

                    <Select

                      value={formData.appointmentType}

                      onValueChange={(value) => {

                        setFormData({ ...formData, appointmentType: value });

                      }}

                    >

                      <SelectTrigger className="mt-2 border-blue-200">

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="initial-assessment">{t('admin.appointments.types.initial-assessment')}</SelectItem>

                        <SelectItem value="follow-up">{t('admin.appointments.types.follow-up')}</SelectItem>

                        <SelectItem value="rehabilitation">{t('admin.appointments.types.rehabilitation')}</SelectItem>

                        <SelectItem value="post-operative">{t('admin.appointments.types.post-operative')}</SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                  <div>

                    <Label className="text-gray-700 font-semibold">{t('admin.appointments.duration-min')} *</Label>

                    <Input

                      type="number"

                      value={formData.duration.toString()}

                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 45 })}

                      min={30}

                      max={60}

                      step={15}

                      className="mt-2 border-blue-200 focus:border-blue-400"

                    />

                  </div>

                </div>



                <div className="flex justify-end gap-3 pt-4">

                  <Button 

                    variant="outline" 

                    onClick={() => setStep(1)}

                    className="border-2 border-gray-300 hover:bg-gray-50"

                  >

                    {t('admin.appointments.back')}

                  </Button>

                  <Button 

                    onClick={() => setStep(3)}

                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-300/50"

                  >

                    {t('admin.appointments.next-room')}

                  </Button>

                </div>

              </div>

            )}



            {/* Step 3: Room & Availability */}

            {step === 3 && (

              <div className="space-y-6 animate-fade-in">

                <div>

                  <Label className="text-gray-700 font-semibold flex items-center gap-2">

                    <MapPin className="w-4 h-4 text-blue-500" />

                    {t('admin.appointments.room')} *

                  </Label>

                  <Select

                    value={formData.room}

                    onValueChange={(value) => {

                      setFormData({ ...formData, room: value });

                      setAvailabilityChecked(false);

                    }}

                  >

                    <SelectTrigger className="mt-2 border-blue-200">

                      <SelectValue />

                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="Room 1">Room 1</SelectItem>

                      <SelectItem value="Room 2">Room 2</SelectItem>

                      <SelectItem value="Room 3">Room 3</SelectItem>

                      <SelectItem value="Room 4">Room 4</SelectItem>

                    </SelectContent>

                  </Select>

                </div>



                <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-100/50">

                  <div className="flex items-center justify-between mb-6">

                    <div>

                      <h3 className="font-bold text-gray-900 text-lg">{t('admin.appointments.availability-check')}</h3>

                      <p className="text-sm text-gray-600 mt-1">

                        {formData.date} at {formData.time} in {formData.room}

                      </p>

                    </div>

                    <Button

                      onClick={checkAvailability}

                      disabled={loading}

                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-300/50"

                    >

                      {loading ? t('admin.appointments.checking') : t('admin.appointments.check-availability')}

                    </Button>

                  </div>



                  {availabilityChecked && (

                    <div className={`flex items-center gap-3 p-4 rounded-xl animate-fade-in ${

                      isAvailable 

                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300' 

                        : 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300'

                    }`}>

                      {isAvailable ? (

                        <CheckCircle className="w-6 h-6 text-emerald-600" />

                      ) : (

                        <XCircle className="w-6 h-6 text-red-600" />

                      )}

                      <span className={`font-semibold ${isAvailable ? 'text-emerald-800' : 'text-red-800'}`}>

                        {availabilityMessage}

                      </span>

                    </div>

                  )}

                </div>



                <div className="flex justify-end gap-3 pt-4">

                  <Button 

                    variant="outline" 

                    onClick={() => setStep(2)}

                    className="border-2 border-gray-300 hover:bg-gray-50"

                  >

                    {t('admin.appointments.back')}

                  </Button>

                  <Button

                    onClick={() => setStep(4)}

                    disabled={!availabilityChecked || !isAvailable}

                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed"

                  >

                    {t('admin.appointments.next-confirmation')}

                  </Button>

                </div>

              </div>

            )}



            {/* Step 4: Confirmation */}

            {step === 4 && (

              <div className="space-y-6 animate-fade-in">

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg shadow-blue-100/50">

                  <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">

                    <CheckCircle className="w-5 h-5 text-blue-600" />

                    {t('admin.appointments.review-details')}

                  </h3>

                  <div className="space-y-4">

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">

                      <span className="text-gray-600 font-medium">{t('admin.patient')}:</span>

                      <span className="font-bold text-gray-900">{selectedPatient?.firstName} {selectedPatient?.lastName}</span>

                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">

                      <span className="text-gray-600 font-medium">{t('admin.appointments.date')}:</span>

                      <span className="font-bold text-gray-900">{new Date(formData.date).toLocaleDateString()}</span>

                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">

                      <span className="text-gray-600 font-medium">{t('admin.appointments.time')}:</span>

                      <span className="font-bold text-gray-900">{formData.time}</span>

                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">

                      <span className="text-gray-600 font-medium">{t('admin.appointments.duration-min')}:</span>

                      <span className="font-bold text-gray-900">{formData.duration} {t('admin.therapist.min')}</span>

                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">

                      <span className="text-gray-600 font-medium">{t('admin.appointments.appointment-type')}:</span>

                      <span className="font-bold text-gray-900">{formData.appointmentType.replace('-', ' ')}</span>

                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">

                      <span className="text-gray-600 font-medium">{t('admin.appointments.room')}:</span>

                      <span className="font-bold text-gray-900">{formData.room}</span>

                    </div>

                  </div>

                </div>



                <div>

                  <Label className="text-gray-700 font-semibold">{t('admin.appointments.medical-notes-optional')}</Label>

                  <Textarea

                    value={formData.medicalNotes}

                    onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}

                    rows={4}
                    placeholder={t('admin.appointments.medical-notes-placeholder')}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    {t('admin.appointments.back')}
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? t('common.loading') : t('admin.appointments.create-appointment')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
    </div>
  );
}