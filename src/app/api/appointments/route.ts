import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Appointment, UserProfile, Patient, IAppointment } from '@/lib/models';
import { generateAllAppointmentsReport } from '@/lib/docx-generator';

// GET /api/appointments - Get appointments (role-based)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const therapistId = searchParams.get('therapistId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportType = searchParams.get('export');

    const query: Record<string, unknown> = {};

    const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
    const isAdmin = userProfile.role === 'admin' || userProfile.roles?.includes('admin');

    // Role-based filtering
    if (isTherapist) {
      // Therapists can only see their own appointments
      query.therapistId = userProfile.userId;
    } else if (isAdmin) {
      // Admins can see all appointments or filter by therapist
      if (therapistId) {
        query.therapistId = therapistId;
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 403 }
      );
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName medicalRecordNumber phoneNumber')
      .sort({ date: 1, time: 1 });

    if (exportType === 'docx' && isAdmin) {
      const buffer = await generateAllAppointmentsReport(appointments as unknown as IAppointment[]);
      const filenameBase = startDate && endDate
        ? `appointments_${startDate}_${endDate}`
        : date
          ? `appointments_${date}`
          : `appointments_all`;
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filenameBase}.docx"`,
        },
      });
    }

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    const isTherapist = !!userProfile && (userProfile.role === 'therapist' || userProfile.roles?.includes('therapist'));
    if (!userProfile || !isTherapist) {
      return NextResponse.json(
        { error: 'Only therapists can create appointments' },
        { status: 403 }
      );
    }

    if (userProfile.status !== 'approved' && userProfile.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not approved yet' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      date,
      time,
      duration,
      appointmentType,
      room,
      medicalNotes,
      specialRequirements
    } = body;

    // Validate required fields
    if (!patientId || !date || !time || !duration || !appointmentType || !room) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check availability
    const availabilityCheck = await checkAvailability({
      therapistId: userProfile.userId,
      date: new Date(date),
      time,
      duration,
      room
    });

    if (!availabilityCheck.isAvailable) {
      return NextResponse.json(
        {
          error: 'Time slot not available',
          conflictingAppointment: availabilityCheck.conflictingAppointment,
          alternativeTimes: availabilityCheck.alternativeTimes,
          alternativeRooms: availabilityCheck.alternativeRooms
        },
        { status: 409 }
      );
    }

    // Get patient info
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create appointment
    const appointment = new Appointment({
      therapistId: userProfile.userId,
      therapistName: `${userProfile.firstName} ${userProfile.lastName}`,
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: patient.phoneNumber,
      date: new Date(date),
      time,
      duration,
      appointmentType,
      room,
      medicalNotes,
      specialRequirements,
      status: 'pending'
    });

    await appointment.save();

    // Update patient appointment history
    patient.appointmentHistory.push({
      appointmentId: appointment._id,
      date: appointment.date,
      therapist: appointment.therapistName,
      type: appointmentType,
      status: 'pending'
    });
    await patient.save();

    // Update therapist appointment count
    userProfile.totalAppointments += 1;
    await userProfile.save();

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Availability check function
async function checkAvailability(data: {
  therapistId: string;
  date: Date;
  time: string;
  duration: number;
  room: string;
}): Promise<{
  isAvailable: boolean;
  conflictingAppointment?: any;
  alternativeTimes?: string[];
  alternativeRooms?: string[];
}> {
  // Check 1: Therapist's daily limit (max 12)
  const startOfDay = new Date(data.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setHours(23, 59, 59, 999);

  const therapistDailyCount = await Appointment.countDocuments({
    therapistId: data.therapistId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  });

  if (therapistDailyCount >= 12) {
    return { isAvailable: false };
  }

  // Check 2: Room availability at that time
  const appointmentStart = new Date(data.date);
  const [hours, minutes] = data.time.split(':').map(Number);
  appointmentStart.setHours(hours, minutes, 0, 0);
  const appointmentEnd = new Date(appointmentStart.getTime() + data.duration * 60000);

  // Check room availability - simpler approach
  const allRoomAppointments = await Appointment.find({
    room: data.room,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: 'cancelled' }
  });

  const roomConflict = allRoomAppointments.find(apt => {
    const aptStart = new Date(apt.date);
    const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
    aptStart.setHours(aptHours, aptMinutes, 0, 0);
    const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

    // Check for overlap
    return (appointmentStart < aptEnd && appointmentEnd > aptStart);
  });

  if (roomConflict) {
    return {
      isAvailable: false,
      conflictingAppointment: roomConflict,
      alternativeTimes: suggestAlternativeTimes(data),
      alternativeRooms: await suggestAlternativeRooms(data)
    };
  }

  // Check 3: Therapist's own schedule conflict (with 15 min buffer)
  const bufferMinutes = 15;
  const bufferStart = new Date(appointmentStart.getTime() - bufferMinutes * 60000);
  const bufferEnd = new Date(appointmentEnd.getTime() + bufferMinutes * 60000);

  const therapistAppointments = await Appointment.find({
    therapistId: data.therapistId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: 'cancelled' }
  });

  const therapistConflict = therapistAppointments.find(apt => {
    const aptStart = new Date(apt.date);
    const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
    aptStart.setHours(aptHours, aptMinutes, 0, 0);
    const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

    return (bufferStart < aptEnd && bufferEnd > aptStart);
  });

  if (therapistConflict) {
    return {
      isAvailable: false,
      conflictingAppointment: therapistConflict,
      alternativeTimes: suggestAlternativeTimes(data),
      alternativeRooms: await suggestAlternativeRooms(data)
    };
  }

  return { isAvailable: true };
}

function suggestAlternativeTimes(data: { date: Date; time: string; duration: number }): string[] {
  const alternatives: string[] = [];
  const [hours, minutes] = data.time.split(':').map(Number);
  
  // Suggest times before and after
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    const newHours = hours + offset;
    if (newHours >= 8 && newHours < 20) {
      alternatives.push(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }
  
  return alternatives.slice(0, 3);
}

async function suggestAlternativeRooms(data: { date: Date; time: string; duration: number }): Promise<string[]> {
  const { Room } = await import('@/lib/models');
  const rooms = await Room.find({ isActive: true });
  const availableRooms: string[] = [];

  for (const room of rooms) {
    if (room.name === data.room) continue;    
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const conflicts = await Appointment.find({
      room: room.name,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
      time: data.time
    });

    if (conflicts.length === 0) {
      availableRooms.push(room.name);
    }
  }

  return availableRooms;
}

