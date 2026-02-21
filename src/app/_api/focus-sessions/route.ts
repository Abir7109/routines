import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/focus-sessions - Get all focus sessions for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const sessions = await db.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching focus sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch focus sessions" },
      { status: 500 }
    );
  }
}

// POST /api/focus-sessions - Create a new focus session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subject, duration, ambientSound } = body;

    if (!userId || !subject || !duration) {
      return NextResponse.json(
        { error: "userId, subject, and duration are required" },
        { status: 400 }
      );
    }

    const session = await db.focusSession.create({
      data: {
        userId,
        subject,
        duration: parseInt(duration),
        ambientSound,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Error creating focus session:", error);
    return NextResponse.json(
      { error: "Failed to create focus session" },
      { status: 500 }
    );
  }
}
