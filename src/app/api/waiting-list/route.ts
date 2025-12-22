import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { WaitingList, UserProfile, Patient, Appointment } from '@/lib/models';

// GET /api/waiting-list - Get waiting list entries
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

    let query: any = {};

    // Role-based filtering
    if (userProfile.role === 'therapist') {
      query.therapistId = userProfile.userId;
    } else if (userProfile.role === 'admin') {
      // Admins can see all waiting list entries
      const therapistId = new URL(request.url).searchParams.get('therapistId');
      if (therapistId) {
        query.therapistId = therapistId;
      }
    }

    const waitingList = await WaitingList.find(query)
      .populate('patientId')
      .sort({ priorityNumber: 1, dateAdded: 1 });

    return NextResponse.json(waitingList);
  } catch (error) {
    console.error('Error fetching waiting list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/waiting-list - Add to waiting list
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

    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    if (!userProfile || userProfile.role !== 'therapist') {
      return NextResponse.json(
        { error: 'Only therapists can add to waiting list' },
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
      desiredDate,
      desiredTime,
      appointmentType,
      duration,
      roomPreference,
      notes
    } = body;

    // Validate required fields
    if (!patientId || !desiredDate || !desiredTime || !appointmentType || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    // Check therapist daily appointments
    const appointmentDate = new Date(desiredDate);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const therapistDailyCount = await Appointment.countDocuments({
      therapistId: userProfile.userId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    // Get current priority number for this therapist and date
    const existingEntries = await WaitingList.find({
      therapistId: userProfile.userId,
      desiredDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ priorityNumber: -1 }).limit(1);

    const priorityNumber = existingEntries.length > 0
      ? existingEntries[0].priorityNumber + 1
      : 1;

    // Create waiting list entry
    const waitingListEntry = new WaitingList({
      therapistId: userProfile.userId,
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: patient.phoneNumber,
      desiredDate: appointmentDate,
      desiredTime,
      appointmentType,
      duration,
      roomPreference,
      notes,
      priorityNumber
    });

    await waitingListEntry.save();

    return NextResponse.json(waitingListEntry, { status: 201 });
  } catch (error) {
    console.error('Error adding to waiting list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

