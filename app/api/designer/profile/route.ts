import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designerProfiles, portfolioProjects, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve profile owned by current user
    const [profile] = await db
      .select()
      .from(designerProfiles)
      .where(eq(designerProfiles.userId, currentUser.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ profile: null, projects: [] });
    }

    // Retrieve associated portfolio projects
    const projects = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.designerProfileId, profile.id));

    return NextResponse.json({ profile, projects });
  } catch (error) {
    console.error("GET designer profile error:", error);
    return NextResponse.json(
      { error: "Unable to load profile." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      title,
      bio,
      phone,
      showPhonePublicly,
      city,
      serviceLocations,
      yearsExperience,
      specializations,
      services,
      projectTypes,
      profileImage,
      startingBudget,
      isDraft,
      portfolioProject,
    } = body || {};

    if (!displayName || !title || !city) {
      return NextResponse.json(
        { error: "Display name, professional title, and city are required." },
        { status: 400 }
      );
    }

    // Profile status: draft or pending review
    const targetStatus = isDraft ? "draft" : "pending";

    // Check if profile already exists for this user
    const [existingProfile] = await db
      .select({ id: designerProfiles.id, status: designerProfiles.status })
      .from(designerProfiles)
      .where(eq(designerProfiles.userId, currentUser.id))
      .limit(1);

    let savedProfileId: number;

    if (existingProfile) {
      // Update existing profile (preserves owner isolation)
      const [updated] = await db
        .update(designerProfiles)
        .set({
          displayName: displayName.trim(),
          title: title.trim(),
          bio: typeof bio === "string" ? bio.trim() : null,
          phone: typeof phone === "string" ? phone.trim() : null,
          showPhonePublicly: Boolean(showPhonePublicly),
          city: city.trim(),
          serviceLocations: Array.isArray(serviceLocations) ? serviceLocations : [],
          yearsExperience: Number(yearsExperience) || 0,
          specializations: Array.isArray(specializations) ? specializations : [],
          services: Array.isArray(services) ? services : [],
          projectTypes: Array.isArray(projectTypes) ? projectTypes : [],
          profileImage: typeof profileImage === "string" ? profileImage.trim() : null,
          startingBudget: typeof startingBudget === "string" ? startingBudget.trim() : null,
          status: targetStatus,
          updatedAt: new Date(),
        })
        .where(eq(designerProfiles.id, existingProfile.id))
        .returning();

      savedProfileId = updated.id;
    } else {
      // Create new profile linked strictly to authenticated user
      const [created] = await db
        .insert(designerProfiles)
        .values({
          userId: currentUser.id,
          displayName: displayName.trim(),
          title: title.trim(),
          bio: typeof bio === "string" ? bio.trim() : null,
          phone: typeof phone === "string" ? phone.trim() : null,
          showPhonePublicly: Boolean(showPhonePublicly),
          city: city.trim(),
          serviceLocations: Array.isArray(serviceLocations) ? serviceLocations : [],
          yearsExperience: Number(yearsExperience) || 0,
          specializations: Array.isArray(specializations) ? specializations : [],
          services: Array.isArray(services) ? services : [],
          projectTypes: Array.isArray(projectTypes) ? projectTypes : [],
          profileImage: typeof profileImage === "string" ? profileImage.trim() : null,
          startingBudget: typeof startingBudget === "string" ? startingBudget.trim() : null,
          status: targetStatus,
        })
        .returning();

      savedProfileId = created.id;

      // Update user role to 'designer' if they were 'customer'
      if (currentUser.role !== "admin") {
        await db
          .update(users)
          .set({ role: "designer" })
          .where(eq(users.id, currentUser.id));
      }
    }

    // Save portfolio project if provided
    if (portfolioProject && portfolioProject.title) {
      const [existingProject] = await db
        .select({ id: portfolioProjects.id })
        .from(portfolioProjects)
        .where(eq(portfolioProjects.designerProfileId, savedProfileId))
        .limit(1);

      if (existingProject) {
        await db
          .update(portfolioProjects)
          .set({
            title: portfolioProject.title.trim(),
            category: portfolioProject.category || "Residential",
            description: portfolioProject.description || null,
            images: Array.isArray(portfolioProject.images)
              ? portfolioProject.images
              : [],
            updatedAt: new Date(),
          })
          .where(eq(portfolioProjects.id, existingProject.id));
      } else {
        await db.insert(portfolioProjects).values({
          designerProfileId: savedProfileId,
          title: portfolioProject.title.trim(),
          category: portfolioProject.category || "Residential",
          description: portfolioProject.description || null,
          images: Array.isArray(portfolioProject.images)
            ? portfolioProject.images
            : [],
        });
      }
    }

    return NextResponse.json({
      message:
        targetStatus === "draft"
          ? "Profile draft saved successfully."
          : "Profile submitted for administrator approval.",
      profileId: savedProfileId,
      status: targetStatus,
    });
  } catch (error) {
    console.error("POST designer profile error:", error);
    return NextResponse.json(
      { error: "Unable to save designer profile." },
      { status: 500 }
    );
  }
}
