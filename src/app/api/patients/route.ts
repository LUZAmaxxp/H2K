import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Patient, UserProfile } from '@/lib/models';

// GET /api/patients - Search patients
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
    const query = searchParams.get('q');
    const medicalRecordNumber = searchParams.get('medicalRecordNumber');
    const phoneNumber = searchParams.get('phoneNumber');

    const searchQuery: Record<string, unknown> = {};

    if (query) {
      // Search by name
      searchQuery.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { medicalRecordNumber: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ];
    }

    if (medicalRecordNumber) {
      searchQuery.medicalRecordNumber = medicalRecordNumber;
    }

    if (phoneNumber) {
      searchQuery.phoneNumber = phoneNumber;
    }

    const patients = await Patient.find(searchQuery)
      .limit(20)
      .sort({ createdAt: -1 });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create new patient
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
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Only therapists and admins can create patients
    const isTherapist = userProfile.role === 'therapist' || userProfile.roles?.includes('therapist');
    const isAdmin = userProfile.role === 'admin' || userProfile.roles?.includes('admin');
    if (!isTherapist && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      medicalRecordNumber,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      email,
      insuranceProvider,
      insuranceNumber,
      medicalNotes,
      allergies
    } = body;

    // Validate required fields
    if (!medicalRecordNumber || !firstName || !lastName || !dateOfBirth || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: medicalRecordNumber, firstName, lastName, dateOfBirth, phoneNumber' },
        { status: 400 }
      );
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ medicalRecordNumber });
    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this medical record number already exists' },
        { status: 409 }
      );
    }

    // Create patient
    const patient = new Patient({
      medicalRecordNumber,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      phoneNumber,
      email,
      insuranceProvider,
      insuranceNumber,
      medicalNotes,
      allergies: allergies || [],
      appointmentHistory: []
    });

    await patient.save();

    return NextResponse.json(patient, { status: 201 });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Patient with this medical record number already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

