import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { UserProfile, Appointment, AuditLog } from '@/lib/models';

// GET /api/admin/users - Get all users (admin only)
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
    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const users = await UserProfile.find({}).sort({ createdAt: -1 });

    // Get appointment counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const appointmentCount = await Appointment.countDocuments({
          therapistId: user.userId,
          status: { $ne: 'cancelled' }
        });

        return {
          ...user.toObject(),
          appointmentCount
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id]/role - Update user role (admin only)
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

    const adminProfile = await UserProfile.findOne({ userId: session.user.id });
    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, status } = body; // action: 'approve', 'reject', 'promote', 'demote', 'activate', 'deactivate'

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    const targetUser = await UserProfile.findOne({ userId });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from modifying themselves
    if (targetUser.userId === adminProfile.userId && (action === 'demote' || action === 'deactivate')) {
      return NextResponse.json(
        { error: 'You cannot modify your own account' },
        { status: 400 }
      );
    }

    const oldStatus = targetUser.status;
    const oldRole = targetUser.role;

    // Handle different actions
    switch (action) {
      case 'approve':
        if (targetUser.role === 'therapist') {
          targetUser.status = 'approved';
        }
        break;
      case 'reject':
        if (targetUser.role === 'therapist') {
          targetUser.status = 'rejected';
        }
        break;
      case 'promote':
        if (targetUser.role === 'therapist') {
          targetUser.role = 'admin';
          targetUser.status = 'active';
        } else {
          return NextResponse.json(
            { error: 'Can only promote therapists to admin' },
            { status: 400 }
          );
        }
        break;
      case 'demote':
        if (targetUser.role === 'admin' && targetUser.userId !== adminProfile.userId) {
          targetUser.role = 'therapist';
        } else {
          return NextResponse.json(
            { error: 'Can only demote other admins' },
            { status: 400 }
          );
        }
        break;
      case 'activate':
        targetUser.status = 'active';
        break;
      case 'deactivate':
        targetUser.status = 'inactive';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    await targetUser.save();

    // Log the action
    await AuditLog.create({
      action: action === 'promote' || action === 'demote' ? 'role_change' : 
              action === 'approve' ? 'user_approval' : 'user_rejection',
      performedBy: adminProfile.userId,
      targetUserId: targetUser.userId,
      oldValue: { role: oldRole, status: oldStatus },
      newValue: { role: targetUser.role, status: targetUser.status },
      details: `Admin ${adminProfile.firstName} ${adminProfile.lastName} ${action}d user ${targetUser.firstName} ${targetUser.lastName}`
    });

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

