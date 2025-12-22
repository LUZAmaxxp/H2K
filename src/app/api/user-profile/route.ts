import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { UserProfile } from '@/lib/models';
import { getAdminEmails } from '@/lib/admin-config';
import { emailService } from '@/lib/email-service';

// GET /api/user-profile - Get current user's profile
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

    // Try to find profile by userId first
    let userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    // If not found, try by email (fallback)
    if (!userProfile) {
      userProfile = await UserProfile.findOne({ email: session.user.email });
      
      // If found by email but userId doesn't match, update it
      if (userProfile && userProfile.userId !== session.user.id) {
        userProfile.userId = session.user.id;
        await userProfile.save();
      }
    }
    
    // If still not found, check if this user has admin privileges in the auth system
    // Only auto-create for admin users who are NOT in the middle of sign-up process
    if (!userProfile) {
      try {
        // Auto-create profile for any authenticated user if it doesn't exist
        // This prevents the issue where users exist in auth but have no profile document
        const nameParts = session.user.name?.split(' ') || ['User'];
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Name';
        
        userProfile = new UserProfile({
          userId: session.user.id,
          email: session.user.email,
          role: 'therapist', // Default role as requested
          status: 'pending', // Default status
          firstName: firstName,
          lastName: lastName,
          licenseNumber: 'PENDING-' + Date.now().toString().slice(-6), // Placeholder
          specialization: 'General Physiotherapy', // Default
          totalAppointments: 0
        });
        
        await userProfile.save();
        console.log('Auto-created missing profile for user:', session.user.id);
        
      } catch (createError) {
        console.error('Error auto-creating profile:', createError);
      }
    }
    
    if (!userProfile) {
      // Return a response indicating profile needs to be created
      return NextResponse.json(
        { 
          error: 'User profile not found',
          needsCreation: true,
          userId: session.user.id,
          email: session.user.email
        },
        { status: 404 }
      );
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user-profile - Create user profile (called after sign-up)
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

    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({ userId: session.user.id });
    if (existingProfile) {
      console.log('Profile already exists for user:', session.user.id, existingProfile);
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      licenseNumber,
      specialization,
      phoneNumber,
      role = 'therapist'
    } = body;

    // Validate required fields for therapist
    if (role === 'therapist') {
      if (!firstName || !lastName || !licenseNumber || !specialization) {
        return NextResponse.json(
          { error: 'Missing required fields for therapist: firstName, lastName, licenseNumber, specialization' },
          { status: 400 }
        );
      }
    }

    // Create user profile with pending status for therapists
    const userProfile = new UserProfile({
      userId: session.user.id,
      email: session.user.email,
      role,
      status: role === 'therapist' ? 'pending' : 'active',
      firstName,
      lastName,
      licenseNumber: role === 'therapist' ? licenseNumber : undefined,
      specialization: role === 'therapist' ? specialization : undefined,
      phoneNumber,
      totalAppointments: 0
    });

    await userProfile.save();

    // Notify admins about new therapist registration
    if (role === 'therapist') {
      try {
        const adminEmails = await getAdminEmails();
        if (adminEmails.length > 0) {
          await emailService.sendEmail({
            to: adminEmails,
            subject: 'New Therapist Registration - Pending Approval',
            html: `
              <h2>New Therapist Registration</h2>
              <p>A new therapist has registered and is pending approval:</p>
              <ul>
                <li><strong>Name:</strong> ${firstName} ${lastName}</li>
                <li><strong>Email:</strong> ${session.user.email}</li>
                <li><strong>License Number:</strong> ${licenseNumber}</li>
                <li><strong>Specialization:</strong> ${specialization}</li>
                <li><strong>Phone:</strong> ${phoneNumber || 'N/A'}</li>
              </ul>
              <p>Please review and approve/reject this registration in the admin dashboard.</p>
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(userProfile, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user-profile - Update user profile
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { phoneNumber, specialization } = body;

    // Users can only update certain fields
    if (phoneNumber !== undefined) userProfile.phoneNumber = phoneNumber;
    if (specialization !== undefined && userProfile.role === 'therapist') {
      userProfile.specialization = specialization;
    }

    userProfile.updatedAt = new Date();
    await userProfile.save();

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

