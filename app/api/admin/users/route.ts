import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Admin GET users error:", error);
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, status, role } = body || {};

    if (!userId || typeof userId !== "number") {
      return NextResponse.json({ error: "Valid userId is required." }, { status: 400 });
    }

    // Prevent admin from suspending their own account
    if (userId === currentUser.id && status === "suspended") {
      return NextResponse.json({ error: "You cannot suspend your own admin account." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status && ["active", "suspended"].includes(status)) {
      updates.status = status;
    }

    if (role && ["admin", "customer", "designer"].includes(role)) {
      updates.role = role;
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        status: users.status,
      });

    return NextResponse.json({ message: "User account updated.", user: updated });
  } catch (error) {
    console.error("Admin PATCH user error:", error);
    return NextResponse.json({ error: "Unable to update user account." }, { status: 500 });
  }
}
