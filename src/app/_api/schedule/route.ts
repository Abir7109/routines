import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch schedule for a specific date
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
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

    // Fetch schedule items for the date
    const scheduleItems = await db.scheduleItem.findMany({
      where: {
        userId: user.id,
        date: date,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Format time to 12-hour format
    const formattedItems = scheduleItems.map((item) => {
      const [hours, mins] = item.time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return {
        id: item.id,
        subject: item.subject,
        time: `${hour12}:${mins} ${ampm}`,
        duration: `${item.duration} min`,
        tag: item.tag || 'General',
        completed: item.completed,
        order: item.order,
      };
    });

    return NextResponse.json({
      items: formattedItems,
      date,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

// POST - Create new schedule item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, tag, time, duration, date, order } = body;

    // Validation
    if (!subject || !time || !duration || !date) {
      return NextResponse.json(
        { error: 'Subject, time, duration, and date are required' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'Duration must be a positive number' },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm' },
        { status: 400 }
      );
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

    // Create schedule item
    const newItem = await db.scheduleItem.create({
      data: {
        userId: user.id,
        subject,
        tag: tag || 'General',
        date,
        time,
        duration,
        order: order ?? 0,
        completed: false,
      },
    });

    return NextResponse.json({
      id: newItem.id,
      subject: newItem.subject,
      time: newItem.time,
      duration: newItem.duration,
      tag: newItem.tag,
      completed: false,
    });
  } catch (error) {
    console.error('Error creating schedule item:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule item' },
      { status: 500 }
    );
  }
}
