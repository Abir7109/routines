import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH - Update schedule item (toggle completed, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { completed } = body;

    // Validation
    if (completed === undefined) {
      return NextResponse.json(
        { error: 'completed field is required' },
        { status: 400 }
      );
    }

    // Update schedule item
    const updatedItem = await db.scheduleItem.update({
      where: { id: params.id },
      data: { completed },
    });

    // If session is completed, record as focus session
    if (completed) {
      // Get user
      const user = await db.user.findFirst();
      if (user) {
        // Parse duration (remove ' min' suffix if present)
        let duration = updatedItem.duration;
        if (typeof duration === 'string') {
          const match = duration.match(/(\d+)/);
          duration = match ? parseInt(match[1]) * 60 : 0; // Convert to seconds
        }

        // Create focus session
        await db.focusSession.create({
          data: {
            userId: user.id,
            subject: updatedItem.subject,
            duration: duration as number,
            completed: true,
            completedAt: new Date(),
          },
        });

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];
        const existingStats = await db.dailyStats.findFirst({
          where: {
            userId: user.id,
            date: today,
          },
        });

        if (existingStats) {
          await db.dailyStats.update({
            where: { id: existingStats.id },
            data: {
              sessionsCount: existingStats.sessionsCount + 1,
              sessionsCompleted: existingStats.sessionsCompleted + 1,
              totalFocusTime: existingStats.totalFocusTime + (duration as number),
            },
          });
        } else {
          await db.dailyStats.create({
            data: {
              userId: user.id,
              date: today,
              sessionsCount: 1,
              sessionsCompleted: 1,
              totalFocusTime: duration as number,
            },
          });
        }
      }
    }

    return NextResponse.json({
      id: updatedItem.id,
      completed: updatedItem.completed,
    });
  } catch (error) {
    console.error('Error updating schedule item:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete schedule item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.scheduleItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule item' },
      { status: 500 }
    );
  }
}
