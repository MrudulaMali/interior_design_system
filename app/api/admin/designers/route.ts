import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designerProfiles, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const profiles = await db
      .select({
        id: designerProfiles.id,
        userId: designerProfiles.userId,
        displayName: designerProfiles.displayName,
        title: designerProfiles.title,
        city: designerProfiles.city,
        yearsExperience: designerProfiles.yearsExperience,
        specializations: designerProfiles.specializations,
        services: designerProfiles.services,
        status: designerProfiles.status,
        rejectionReason: designerProfiles.rejectionReason,
        rating: designerProfiles.rating,
        createdAt: designerProfiles.createdAt,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(designerProfiles)
      .innerJoin(users, eq(designerProfiles.userId, users.id))
      .orderBy(desc(designerProfiles.createdAt));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Admin GET designers error:", error);
    return NextResponse.json({ error: "Unable to load designer profiles." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const { profileId, status, rejectionReason } = body || {};

    if (!profileId || typeof profileId !== "number") {
      return NextResponse.json({ error: "Valid profileId is required." }, { status: 400 });
    }

    if (!status || !["approved", "rejected", "pending", "draft"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required." }, { status: 400 });
    }

    const [updated] = await db
      .update(designerProfiles)
      .set({
        status,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(designerProfiles.id, profileId))
      .returning();

    return NextResponse.json({
      message: `Designer profile marked as ${status}.`,
      profile: updated,
    });
  } catch (error) {
    console.error("Admin PATCH designer error:", error);
    return NextResponse.json({ error: "Unable to update designer profile." }, { status: 500 });
  }
}
