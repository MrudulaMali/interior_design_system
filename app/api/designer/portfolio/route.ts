import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { designerProfiles, portfolioProjects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db
      .select({ id: designerProfiles.id })
      .from(designerProfiles)
      .where(eq(designerProfiles.userId, currentUser.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ projects: [], hasProfile: false });
    }

    const projects = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.designerProfileId, profile.id))
      .orderBy(desc(portfolioProjects.createdAt));

    return NextResponse.json({ projects, hasProfile: true, profileId: profile.id });
  } catch (error) {
    console.error("GET designer portfolio error:", error);
    return NextResponse.json({ error: "Unable to load portfolio projects." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure designer has a profile
    let [profile] = await db
      .select({ id: designerProfiles.id })
      .from(designerProfiles)
      .where(eq(designerProfiles.userId, currentUser.id))
      .limit(1);

    if (!profile) {
      // Auto-create a minimal profile if not present yet
      const [newProfile] = await db
        .insert(designerProfiles)
        .values({
          userId: currentUser.id,
          displayName: currentUser.fullName || "Designer Studio",
          title: "Interior Designer",
          city: "Pune",
          status: "draft",
        })
        .returning({ id: designerProfiles.id });
      profile = newProfile;
    }

    const body = await request.json();
    const { id, title, category, description, images } = body || {};

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Project title is required." }, { status: 400 });
    }

    const cleanImages = Array.isArray(images)
      ? images.filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0)
      : [];

    let savedProject;

    if (id && Number(id) > 0) {
      // Update existing project owned by this designer
      const [updated] = await db
        .update(portfolioProjects)
        .set({
          title: title.trim(),
          category: category || "Residential",
          description: description ? description.trim() : null,
          images: cleanImages,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(portfolioProjects.id, Number(id)),
            eq(portfolioProjects.designerProfileId, profile.id)
          )
        )
        .returning();

      savedProject = updated;
    } else {
      // Create new portfolio project
      const [created] = await db
        .insert(portfolioProjects)
        .values({
          designerProfileId: profile.id,
          title: title.trim(),
          category: category || "Residential",
          description: description ? description.trim() : null,
          images: cleanImages,
        })
        .returning();

      savedProject = created;
    }

    try {
      revalidatePath("/");
      revalidatePath("/designers");
      revalidatePath("/portfolio");
      revalidatePath(`/designer/${profile.id}`);
    } catch (err) {
      console.error("Cache revalidation error:", err);
    }

    return NextResponse.json({
      success: true,
      project: savedProject,
      message: "Portfolio project saved successfully.",
    });
  } catch (error) {
    console.error("POST designer portfolio error:", error);
    return NextResponse.json({ error: "Unable to save portfolio project." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db
      .select({ id: designerProfiles.id })
      .from(designerProfiles)
      .where(eq(designerProfiles.userId, currentUser.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Designer profile not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const projectId = idParam ? Number(idParam) : null;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    await db
      .delete(portfolioProjects)
      .where(
        and(
          eq(portfolioProjects.id, projectId),
          eq(portfolioProjects.designerProfileId, profile.id)
        )
      );

    try {
      revalidatePath("/");
      revalidatePath("/designers");
      revalidatePath("/portfolio");
      revalidatePath(`/designer/${profile.id}`);
    } catch (err) {
      console.error("Cache revalidation error:", err);
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("DELETE designer portfolio error:", error);
    return NextResponse.json({ error: "Unable to delete portfolio project." }, { status: 500 });
  }
}
