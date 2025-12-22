import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { WaitingList, UserProfile, Appointment, Patient } from '@/lib/models';

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

    // Role-based access control
    if (userProfile.role === 'therapist' && waitingListEntry.therapistId !== userProfile.userId) {
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
    if (!userProfile || userProfile.role !== 'therapist') {
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

    // Check availability
    const { checkAvailability } = await import('@/app/api/appointments/route');
    // For now, we'll do a simple check
    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const therapistDailyCount = await Appointment.countDocuments({
      therapistId: userProfile.userId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    if (therapistDailyCount >= 12) {
      return NextResponse.json(
        { error: 'Therapist has reached daily limit of 12 appointments' },
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

