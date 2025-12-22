import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { UserSettings } from '@/lib/models';

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

    // Connect to database
    await dbConnect();

    // Fetch user settings
    let userSettings = await UserSettings.findOne({ userId: session.user.id });

    // If no settings exist, create default settings
    if (!userSettings) {
      userSettings = new UserSettings({
        userId: session.user.id,
        notifications: {
          emailNotifications: true,
          pushNotifications: false,
          weeklyReports: true,
        },
        appearance: {
          darkMode: false,
          compactView: false,
        },
        language: 'en-US',
        timezone: 'UTC-5',
      });
      await userSettings.save();
    }

    return NextResponse.json({
      success: true,
      settings: {
        notifications: userSettings.notifications,
        appearance: userSettings.appearance,
        language: userSettings.language,
        timezone: userSettings.timezone,
      }
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { notifications, appearance, language, timezone } = body;

    // Validate input
    if (notifications && typeof notifications !== 'object') {
      return NextResponse.json(
        { error: 'Invalid notifications format' },
        { status: 400 }
      );
    }

    if (appearance && typeof appearance !== 'object') {
      return NextResponse.json(
        { error: 'Invalid appearance format' },
        { status: 400 }
      );
    }

    if (language && typeof language !== 'string') {
      return NextResponse.json(
        { error: 'Invalid language format' },
        { status: 400 }
      );
    }

    if (timezone && typeof timezone !== 'string') {
      return NextResponse.json(
        { error: 'Invalid timezone format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Update or create user settings
    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId: session.user.id },
      {
        ...(notifications && { notifications }),
        ...(appearance && { appearance }),
        ...(language && { language }),
        ...(timezone && { timezone }),
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      settings: {
        notifications: updatedSettings.notifications,
        appearance: updatedSettings.appearance,
        language: updatedSettings.language,
        timezone: updatedSettings.timezone,
      }
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
