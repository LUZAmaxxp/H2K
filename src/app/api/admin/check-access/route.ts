import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-config';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const isAdmin = await isAdminEmail(email);

    if (isAdmin) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error checking admin access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
