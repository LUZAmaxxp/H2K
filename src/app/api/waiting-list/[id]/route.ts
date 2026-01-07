import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { WaitingList, UserProfile, Appointment, Patient, Room, IAppointment } from '@/lib/models';

// DELETE /api/waiting-list/[id] - Remove from waiting list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const waitingListEntry = await WaitingList.findById(params.id);
    if (!waitingListEntry) {
      return NextResponse.json(
        { error: 'Waiting list entry not found' },
        { status: 404 }
      );
    }

    const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
    // Role-based access control
    if (isTherapist && waitingListEntry.therapistId !== userProfile.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await WaitingList.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Removed from waiting list successfully' });
  } catch (error) {
    console.error('Error removing from waiting list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/waiting-list/[id]/promote - Move waiting list entry to appointment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    const isTherapist = !!userProfile && (userProfile.role === 'therapist' || userProfile.roles?.includes('therapist'));
    if (!userProfile || !isTherapist) {
      return NextResponse.json(
        { error: 'Only therapists can promote waiting list entries' },
        { status: 403 }
      );
    }

    const waitingListEntry = await WaitingList.findById(params.id);
    if (!waitingListEntry) {
      return NextResponse.json(
        { error: 'Waiting list entry not found' },
        { status: 404 }
      );
    }

    if (waitingListEntry.therapistId !== userProfile.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, time, room } = body;

    if (!date || !time || !room) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time, room' },
        { status: 400 }
      );
    }

    const timeValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
    if (!timeValid) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (24h)' },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(date);
    const availability = await checkAvailability({
      therapistId: userProfile.userId,
      date: appointmentDate,
      time,
      duration: waitingListEntry.duration,
      room
    });

    if (!availability.isAvailable) {
      return NextResponse.json(
        {
          error: 'Time slot not available',
          conflictingAppointment: availability.conflictingAppointment,
          alternativeTimes: availability.alternativeTimes,
          alternativeRooms: availability.alternativeRooms
        },
        { status: 409 }
      );
    }

    // Get patient
    const patient = await Patient.findById(waitingListEntry.patientId);
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
      patientId: waitingListEntry.patientId,
      patientName: waitingListEntry.patientName,
      patientPhone: waitingListEntry.patientPhone,
      date: appointmentDate,
      time,
      duration: waitingListEntry.duration,
      appointmentType: waitingListEntry.appointmentType,
      room,
      status: 'pending',
      medicalNotes: waitingListEntry.notes
    });

    await appointment.save();

    // Update patient appointment history
    patient.appointmentHistory.push({
      appointmentId: appointment._id,
      date: appointment.date,
      therapist: appointment.therapistName,
      type: appointment.appointmentType,
      status: 'pending'
    });
    await patient.save();

    // Remove from waiting list
    await WaitingList.findByIdAndDelete(params.id);

    userProfile.totalAppointments += 1;
    await userProfile.save();

    // TODO: Send SMS notification
    // await sendSMSNotification({
    //   to: waitingListEntry.patientPhone,
    //   message: `Appointment confirmed! You're booked for ${date} at ${time}`
    // });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error promoting waiting list entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkAvailability(data: {
  therapistId: string;
  date: Date;
  time: string;
  duration: number;
  room: string;
}): Promise<{
  isAvailable: boolean;
  conflictingAppointment?: IAppointment;
  alternativeTimes?: string[];
  alternativeRooms?: string[];
}> {
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

  const appointmentStart = new Date(data.date);
  const [hours, minutes] = data.time.split(':').map(Number);
  appointmentStart.setHours(hours, minutes, 0, 0);
  const appointmentEnd = new Date(appointmentStart.getTime() + data.duration * 60000);

  const allRoomAppointments = await Appointment.find({
    room: data.room,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  });

  const roomConflict = allRoomAppointments.find(apt => {
    const aptStart = new Date(apt.date);
    const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
    aptStart.setHours(aptHours, aptMinutes, 0, 0);
    const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
    return appointmentStart < aptEnd && appointmentEnd > aptStart;
  });

  if (roomConflict) {
    return {
      isAvailable: false,
      conflictingAppointment: roomConflict,
      alternativeTimes: suggestAlternativeTimes({ date: data.date, time: data.time, duration: data.duration }),
      alternativeRooms: await suggestAlternativeRooms({ date: data.date, time: data.time, duration: data.duration, currentRoom: data.room })
    };
  }

  const bufferMinutes = 15;
  const bufferStart = new Date(appointmentStart.getTime() - bufferMinutes * 60000);
  const bufferEnd = new Date(appointmentEnd.getTime() + bufferMinutes * 60000);

  const therapistAppointments = await Appointment.find({
    therapistId: data.therapistId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' }
  });

  const therapistConflict = therapistAppointments.find(apt => {
    const aptStart = new Date(apt.date);
    const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
    aptStart.setHours(aptHours, aptMinutes, 0, 0);
    const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
    return bufferStart < aptEnd && bufferEnd > aptStart;
  });

  if (therapistConflict) {
    return {
      isAvailable: false,
      conflictingAppointment: therapistConflict,
      alternativeTimes: suggestAlternativeTimes({ date: data.date, time: data.time, duration: data.duration }),
      alternativeRooms: await suggestAlternativeRooms({ date: data.date, time: data.time, duration: data.duration, currentRoom: data.room })
    };
  }

  return { isAvailable: true };
}

function suggestAlternativeTimes(data: { date: Date; time: string; duration: number }): string[] {
  const alternatives: string[] = [];
  const [hours, minutes] = data.time.split(':').map(Number);
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    const newHours = hours + offset;
    if (newHours >= 8 && newHours < 20) {
      alternatives.push(`${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }
  return alternatives.slice(0, 3);
}

async function suggestAlternativeRooms(data: { date: Date; time: string; duration: number; currentRoom: string }): Promise<string[]> {
  const rooms = await Room.find({ isActive: true });
  const availableRooms: string[] = [];

  for (const room of rooms) {
    if (room.name === data.currentRoom) continue;
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

