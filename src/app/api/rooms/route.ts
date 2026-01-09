import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Room } from '@/lib/models';

// GET /api/rooms - Get all active rooms
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

    const rooms = await Room.find({ isActive: true }).sort({ name: 1 });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create new room (admin only)
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

    // Check if user is admin
    const { UserProfile } = await import('@/lib/models');
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    const isAdmin = !!userProfile && (userProfile.role === 'admin' || userProfile.roles?.includes('admin'));
    if (!userProfile || !isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, capacity, equipment } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    const room = new Room({
      name,
      capacity: capacity || 1,
      equipment: equipment || [],
      isActive: true
    });

    await room.save();

    return NextResponse.json(room, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating room:', error);
    if ((error as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: 'Room with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

