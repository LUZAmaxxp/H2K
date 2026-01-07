import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Appointment, UserProfile } from '@/lib/models';

// GET /api/availability - Check room/therapist availability
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

    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const duration = searchParams.get('duration');
    const room = searchParams.get('room');
    const requestedTherapistId = searchParams.get('therapistId');
    const isAdmin = userProfile.role === 'admin' || userProfile.roles?.includes('admin');
    const therapistId = isAdmin ? (requestedTherapistId || userProfile.userId) : userProfile.userId;

    if (!date || !time || !duration || !room) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, time, duration, room' },
        { status: 400 }
      );
    }

    // Check therapist daily limit
    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const therapistDailyCount = await Appointment.countDocuments({
      therapistId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    if (therapistDailyCount >= 12) {
      return NextResponse.json({
        isAvailable: false,
        reason: 'therapist_daily_limit',
        message: 'Therapist has reached daily limit of 12 appointments'
      });
    }

    // Check room availability
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentStart = new Date(appointmentDate);
    appointmentStart.setHours(hours, minutes, 0, 0);
    const appointmentEnd = new Date(appointmentStart.getTime() + parseInt(duration) * 60000);

    const roomAppointments = await Appointment.find({
      room,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    const roomConflict = roomAppointments.find(apt => {
      const aptStart = new Date(apt.date);
      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      aptStart.setHours(aptHours, aptMinutes, 0, 0);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

      return (appointmentStart < aptEnd && appointmentEnd > aptStart);
    });

    if (roomConflict) {
      return NextResponse.json({
        isAvailable: false,
        reason: 'room_conflict',
        message: 'Room is already booked at this time',
        conflictingAppointment: {
          therapist: roomConflict.therapistName,
          patient: roomConflict.patientName,
          time: roomConflict.time
        }
      });
    }

    // Check therapist schedule conflict (with 15 min buffer)
    const bufferMinutes = 15;
    const bufferStart = new Date(appointmentStart.getTime() - bufferMinutes * 60000);
    const bufferEnd = new Date(appointmentEnd.getTime() + bufferMinutes * 60000);

    const therapistAppointments = await Appointment.find({
      therapistId,
      date: { $gte: startOfDay, $lte: endOfDay },
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
      return NextResponse.json({
        isAvailable: false,
        reason: 'therapist_conflict',
        message: 'Therapist has a conflicting appointment',
        conflictingAppointment: {
          patient: therapistConflict.patientName,
          time: therapistConflict.time,
          room: therapistConflict.room
        }
      });
    }

    return NextResponse.json({
      isAvailable: true,
      message: 'Time slot is available'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

