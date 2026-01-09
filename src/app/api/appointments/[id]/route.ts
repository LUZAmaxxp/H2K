import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Appointment, UserProfile, WaitingList, IAppointment } from '@/lib/models';

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const appointment = await Appointment.findById((await params).id)
      .populate('patientId');

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
    // Role-based access control
    if (isTherapist && appointment.therapistId !== userProfile.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const appointment = await Appointment.findById((await params).id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
    // Role-based access control
    if (isTherapist && appointment.therapistId !== userProfile.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, medicalNotes, specialRequirements } = body;

    // Status transition rules
    if (status) {
      if (appointment.status === 'completed') {
        return NextResponse.json(
          { error: 'Cannot modify completed appointment' },
          { status: 400 }
        );
      }

      if (status === 'completed' && appointment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Invalid status transition' },
          { status: 400 }
        );
      }

      appointment.status = status;
    }

    if (medicalNotes !== undefined) appointment.medicalNotes = medicalNotes;
    if (specialRequirements !== undefined) appointment.specialRequirements = specialRequirements;

    appointment.updatedAt = new Date();
    await appointment.save();

    // Handle waiting list auto-replacement for cancelled/no-show
    if (status === 'cancelled' || status === 'no-show') {
      await handleWaitingListReplacement(appointment);
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const appointment = await Appointment.findById((await params).id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
    const isAdmin = userProfile.role === 'admin' || userProfile.roles?.includes('admin');
    // Only therapist who owns the appointment or admin can delete
    if (!isAdmin && isTherapist && appointment.therapistId !== userProfile.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Can't delete completed appointments
    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed appointment' },
        { status: 400 }
      );
    }

    await Appointment.findByIdAndDelete((await params).id);

    // Handle waiting list replacement
    await handleWaitingListReplacement(appointment);

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Auto-replacement logic for waiting list
async function handleWaitingListReplacement(appointment: IAppointment) {
  try {
    // Find waiting list entries for the same therapist and date
    const waitingListEntries = await WaitingList.find({
      therapistId: appointment.therapistId,
      desiredDate: {
        $gte: new Date(appointment.date.setHours(0, 0, 0, 0)),
        $lte: new Date(appointment.date.setHours(23, 59, 59, 999))
      }
    }).sort('priorityNumber').limit(1);

    if (waitingListEntries.length > 0) {
      const nextPatient = waitingListEntries[0];

      // Create appointment from waiting list
      const newAppointment = new Appointment({
        therapistId: appointment.therapistId,
        therapistName: appointment.therapistName,
        patientId: nextPatient.patientId,
        patientName: nextPatient.patientName,
        patientPhone: nextPatient.patientPhone,
        date: appointment.date,
        time: appointment.time,
        duration: nextPatient.duration,
        appointmentType: nextPatient.appointmentType,
        room: appointment.room,
        status: 'pending',
        medicalNotes: nextPatient.notes
      });

      await newAppointment.save();

      // Remove from waiting list
      await WaitingList.findByIdAndDelete(nextPatient._id);

      // TODO: Send SMS notification to patient
      // await sendSMSNotification({
      //   to: nextPatient.patientPhone,
      //   message: `Appointment available! You're booked for ${newAppointment.date} at ${newAppointment.time}`
      // });
    }
  } catch (error) {
    console.error('Error handling waiting list replacement:', error);
  }
}

