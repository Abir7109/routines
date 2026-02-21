import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings - Get user settings
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

    let settings = await db.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      distractionBlocking,
      ambientSoundsEnabled,
      notificationsEnabled,
      soundEnabled,
      autoStartTimer,
      syncDataEnabled,
      defaultSessionDuration,
      defaultBreakDuration,
      preferredAmbientSound,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const settings = await db.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        distractionBlocking,
        ambientSoundsEnabled,
        notificationsEnabled,
        soundEnabled,
        autoStartTimer,
        syncDataEnabled,
        defaultSessionDuration,
        defaultBreakDuration,
        preferredAmbientSound,
      },
      update: {
        ...(distractionBlocking !== undefined && { distractionBlocking }),
        ...(ambientSoundsEnabled !== undefined && { ambientSoundsEnabled }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
        ...(soundEnabled !== undefined && { soundEnabled }),
        ...(autoStartTimer !== undefined && { autoStartTimer }),
        ...(syncDataEnabled !== undefined && { syncDataEnabled }),
        ...(defaultSessionDuration !== undefined && { defaultSessionDuration }),
        ...(defaultBreakDuration !== undefined && { defaultBreakDuration }),
        ...(preferredAmbientSound !== undefined && { preferredAmbientSound }),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
