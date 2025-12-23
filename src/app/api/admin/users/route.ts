import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { UserProfile, Appointment, AuditLog, IUserProfile } from '@/lib/models';

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
    const isAdmin = !!userProfile && (userProfile.role === 'admin' || userProfile.roles?.includes('admin'));
    if (!userProfile || !isAdmin) {
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
    const isAdmin = !!adminProfile && (adminProfile.role === 'admin' || adminProfile.roles?.includes('admin'));
    if (!adminProfile || !isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body; // action: 'approve', 'reject', 'promote', 'demote', 'activate', 'deactivate'

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    const targetUser = await UserProfile.findOne({ userId }) as unknown as IUserProfile & { roles?: Array<'therapist' | 'admin'> };
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
    const oldRoles: Array<'therapist' | 'admin'> = Array.isArray(targetUser.roles) ? [...targetUser.roles] : [];

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
        if (targetUser.role === 'therapist' || oldRoles.includes('therapist')) {
          const roles = new Set<'therapist' | 'admin'>(oldRoles.length ? oldRoles : [targetUser.role]);
          roles.add('admin');
          targetUser.roles = Array.from(roles);
          targetUser.status = 'active';
        } else {
          return NextResponse.json(
            { error: 'Can only promote therapists to admin' },
            { status: 400 }
          );
        }
        break;
      case 'demote':
        {
          if (targetUser.userId === adminProfile.userId) {
            return NextResponse.json(
              { error: 'You cannot modify your own account' },
              { status: 400 }
            );
          }
          const roles = new Set<'therapist' | 'admin'>(oldRoles.length ? oldRoles : [targetUser.role]);
          roles.delete('admin');
          targetUser.roles = Array.from(roles);
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

    await UserProfile.updateOne({ userId: targetUser.userId }, targetUser);

    // Log the action
    await AuditLog.create({
      action: action === 'promote' || action === 'demote' ? 'role_change' : 
              action === 'approve' ? 'user_approval' : 'user_rejection',
      performedBy: adminProfile.userId,
      targetUserId: targetUser.userId,
      oldValue: { role: oldRole, status: oldStatus },
      newValue: { role: targetUser.role, roles: targetUser.roles, status: targetUser.status },
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

