import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { UserSettings, Appointment, WaitingList, UserProfile } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();

    // Get user profile to check role
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    // Delete all user data
    await Promise.all([
      // If therapist, delete their appointments and waiting list entries
      ...((userProfile?.role === 'therapist' || userProfile?.roles?.includes('therapist')) ? [
        Appointment.deleteMany({ therapistId: session.user.id }),
        WaitingList.deleteMany({ therapistId: session.user.id })
      ] : []),
      UserSettings.deleteOne({ userId: session.user.id }),
      UserProfile.deleteOne({ userId: session.user.id })
    ]);

    // Note: BetterAuth handles user deletion through their API
    // This endpoint only deletes application-specific data

    return NextResponse.json({
      success: true,
      message: 'Account deletion request submitted. All your data has been removed.'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
