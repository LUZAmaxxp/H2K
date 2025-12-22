import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Appointment, UserProfile } from '@/lib/models';
import { isAdminEmail, addAdminEmail, removeAdminEmail } from '@/lib/admin-config';

interface UserDocument {
  _id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  createdAt: Date;
}



export async function GET(request: NextRequest) {
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

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
    await client.connect();
    const db = client.db();

    // Fetch all users from Better Auth collection
    // Better Auth typically uses 'better_auth_users' or similar collection name
    let users: UserDocument[] = [];
    const possibleCollections = ['better_auth_users', 'users', 'accounts', 'user'];

    for (const collectionName of possibleCollections) {
      try {
        const collectionUsers = await db.collection(collectionName).find({}).toArray() as unknown as UserDocument[];
        if (collectionUsers.length > 0) {
          users = collectionUsers;
          console.log(`Found ${users.length} users in collection '${collectionName}'`);
          break;
        }
      } catch (error) {
        console.log(`Collection '${collectionName}' not found or error:`, (error as Error).message);
      }
    }

    if (users.length === 0) {
      console.log('No users found in any collection');
    }

    // For each user, fetch their profile and appointments
    const adminData = await Promise.all(
      users.map(async (user: UserDocument) => {
        const userId = user._id.toString();

        // Get user profile
        const userProfile = await UserProfile.findOne({ userId });
        
        // Get appointments for therapists
        const appointments = userProfile?.role === 'therapist'
          ? await Appointment.find({ therapistId: userId })
            .sort({ createdAt: -1 })
            .lean()
          : [];

        // Get last activity date
        const lastActivity = appointments.length > 0
          ? new Date(Math.max(...appointments.map(a => new Date(a.createdAt).getTime())))
          : userProfile?.lastLogin || null;

        return {
          _id: user._id.toString(),
          email: user.email,
          name: user.name || 'N/A',
          emailVerified: user.emailVerified || false,
          createdAt: user.createdAt,
          role: userProfile?.role || 'therapist',
          status: userProfile?.status || 'pending',
          appointmentsCount: appointments.length,
          totalAppointments: userProfile?.totalAppointments || 0,
          lastActivity: lastActivity,
          appointments: appointments.map((apt: any) => ({
            _id: String(apt._id),
            patientName: apt.patientName,
            date: apt.date,
            time: apt.time,
            duration: apt.duration,
            appointmentType: apt.appointmentType,
            room: apt.room,
            status: apt.status,
            createdAt: apt.createdAt
          }))
        };
      })
    );

    return NextResponse.json(adminData);

  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



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

    // Check if user is admin
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userEmail } = body;

    if (!action || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: action and userEmail' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['promote', 'demote'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "promote" or "demote"' },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (action === 'demote' && session.user.email === userEmail) {
      return NextResponse.json(
        { error: 'You cannot demote yourself' },
        { status: 400 }
      );
    }

    // Connect to database to verify user exists
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
    await client.connect();
    const db = client.db();

    let userExists = false;
    const possibleCollections = ['better_auth_users', 'users', 'accounts', 'user'];

    for (const collectionName of possibleCollections) {
      try {
        const user = await db.collection(collectionName).findOne({ email: userEmail });
        if (user) {
          userExists = true;
          break;
        }
      } catch  {
       
      }
    }

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Perform the action
    if (action === 'promote') {
      addAdminEmail(userEmail);
      console.log(`Promoted ${userEmail} to admin`);
    } else if (action === 'demote') {
      removeAdminEmail(userEmail);
      console.log(`Demoted ${userEmail} from admin`);
    }

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} has been ${action === 'promote' ? 'promoted to' : 'demoted from'} admin role`
    });

  } catch (error) {
    console.error('Error managing admin role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
