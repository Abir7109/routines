import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch user profile and stats
export async function GET() {
  try {
    // For now, we'll return a default user profile
    // In production, this would come from authentication
    const user = await db.user.findFirst();

    if (!user) {
      // Create default user if none exists
      const newUser = await db.user.create({
        data: {
          email: 'user@example.com',
          name: null,
        },
      });

      return NextResponse.json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        bio: null,
        avatar: null,
        totalSessions: 0,
        totalFocusTime: 0,
      });
    }

    // Calculate total sessions and focus time
    const sessions = await db.focusSession.findMany({
      where: { userId: user.id, completed: true },
    });

    const totalSessions = sessions.length;
    const totalFocusTime = sessions.reduce((acc, session) => acc + session.duration, 0);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.settings?.defaultSessionDuration ? `Focuses for ${user.settings.defaultSessionDuration} min sessions` : null,
      avatar: null,
      totalSessions,
      totalFocusTime,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, bio } = body;

    // Validation
    if (name !== undefined && name !== null) {
      if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
        return NextResponse.json(
          { error: 'Name must be between 2-50 characters' },
          { status: 400 }
        );
      }
    }

    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string' && bio !== null) {
        return NextResponse.json(
          { error: 'Invalid bio format' },
          { status: 400 }
        );
      }
      if (bio !== null && bio.length > 200) {
        return NextResponse.json(
          { error: 'Bio must be 200 characters or less' },
          { status: 400 }
        );
      }
    }

    // Get or create user
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'user@example.com',
        },
      });
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name || null }),
      },
    });

    // Update settings if bio is provided
    if (bio !== undefined) {
      const settings = await db.userSettings.findFirst({
        where: { userId: user.id },
      });

      if (settings) {
        await db.userSettings.update({
          where: { userId: user.id },
          data: {
            preferredAmbientSound: bio || null,
          },
        });
      } else {
        await db.userSettings.create({
          data: {
            userId: user.id,
            preferredAmbientSound: bio || null,
          },
        });
      }
    }

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: bio,
      avatar: null,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
