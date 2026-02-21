import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/focus-sessions/[id] - Update a focus session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { completed, pausedAt, completedAt } = body;

    const session = await db.focusSession.update({
      where: { id: params.id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(pausedAt && { pausedAt: new Date(pausedAt) }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error updating focus session:", error);
    return NextResponse.json(
      { error: "Failed to update focus session" },
      { status: 500 }
    );
  }
}

// DELETE /api/focus-sessions/[id] - Delete a focus session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.focusSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting focus session:", error);
    return NextResponse.json(
      { error: "Failed to delete focus session" },
      { status: 500 }
    );
  }
}
