import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designerProfiles, portfolioProjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityParam = searchParams.get("city");
    const styleParam = searchParams.get("style");

    // Only approved designer profiles are shown publicly
    const rawProfiles = await db
      .select({
        id: designerProfiles.id,
        userId: designerProfiles.userId,
        displayName: designerProfiles.displayName,
        title: designerProfiles.title,
        bio: designerProfiles.bio,
        city: designerProfiles.city,
        serviceLocations: designerProfiles.serviceLocations,
        yearsExperience: designerProfiles.yearsExperience,
        specializations: designerProfiles.specializations,
        services: designerProfiles.services,
        projectTypes: designerProfiles.projectTypes,
        profileImage: designerProfiles.profileImage,
        startingBudget: designerProfiles.startingBudget,
        rating: designerProfiles.rating,
        reviewsCount: designerProfiles.reviewsCount,
        phone: designerProfiles.phone,
        showPhonePublicly: designerProfiles.showPhonePublicly,
      })
      .from(designerProfiles)
      .where(eq(designerProfiles.status, "approved"));

    let filtered = rawProfiles.map((p) => ({
      ...p,
      phone: p.showPhonePublicly ? p.phone : null,
    }));

    if (cityParam && cityParam !== "all") {
      filtered = filtered.filter(
        (p) =>
          (p.city && p.city.toLowerCase() === cityParam.toLowerCase()) ||
          (Array.isArray(p.serviceLocations) &&
            (p.serviceLocations as string[]).some(
              (loc: string) => loc.toLowerCase() === cityParam.toLowerCase()
            ))
      );
    }

    if (styleParam && styleParam !== "all") {
      filtered = filtered.filter(
        (p) =>
          Array.isArray(p.specializations) &&
          (p.specializations as string[]).some((s: string) =>
            s.toLowerCase().includes(styleParam.toLowerCase())
          )
      );
    }

    return NextResponse.json({ designers: filtered });
  } catch (error) {
    console.error("GET public designers error:", error);
    return NextResponse.json(
      { error: "Unable to load designers." },
      { status: 500 }
    );
  }
}
