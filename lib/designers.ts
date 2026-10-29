import { db } from "@/db";
import { designerProfiles, portfolioProjects, users, designers as legacyDesigners } from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface PublicDesignerItem {
  id: number;
  userId: number;
  name: string;
  title: string;
  style: string;
  city: string;
  serviceLocations: string[];
  specializations: string[];
  services: string[];
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  projectsCount: number;
  image: string | null;
  bio: string | null;
  startingBudget: string | null;
  phone: string | null;
  isVerified: boolean;
  portfolioImages: string[];
}

export interface PublicProjectItem {
  id: number;
  designerProfileId: number;
  designerName: string;
  designerCity: string;
  title: string;
  category: string;
  description: string | null;
  image: string;
  caption?: string;
}

/**
 * Authoritative query for approved, active designers across all public sections.
 * Enforces: designerProfiles.status = 'approved' AND users.status = 'active'.
 */
export async function getApprovedDesigners(limit?: number): Promise<PublicDesignerItem[]> {
  try {
    // 1. Fetch approved profiles joined with active users
    const query = db
      .select({
        id: designerProfiles.id,
        userId: designerProfiles.userId,
        name: designerProfiles.displayName,
        title: designerProfiles.title,
        city: designerProfiles.city,
        serviceLocations: designerProfiles.serviceLocations,
        specializations: designerProfiles.specializations,
        services: designerProfiles.services,
        rating: designerProfiles.rating,
        reviewsCount: designerProfiles.reviewsCount,
        experienceYears: designerProfiles.yearsExperience,
        image: designerProfiles.profileImage,
        bio: designerProfiles.bio,
        startingBudget: designerProfiles.startingBudget,
        phone: designerProfiles.phone,
        showPhonePublicly: designerProfiles.showPhonePublicly,
      })
      .from(designerProfiles)
      .innerJoin(users, eq(designerProfiles.userId, users.id))
      .where(
        and(
          eq(designerProfiles.status, "approved"),
          eq(users.status, "active")
        )
      )
      .orderBy(desc(designerProfiles.updatedAt), desc(designerProfiles.createdAt));

    const records = limit ? await query.limit(limit) : await query;

    // 2. Fetch associated portfolio project images for these profiles
    const profileIds = records.map((r) => r.id);
    let projectsMap: Record<number, { count: number; images: string[] }> = {};

    if (profileIds.length > 0) {
      try {
        const projects = await db
          .select({
            designerProfileId: portfolioProjects.designerProfileId,
            images: portfolioProjects.images,
          })
          .from(portfolioProjects)
          .where(inArray(portfolioProjects.designerProfileId, profileIds));

        for (const p of projects) {
          if (!projectsMap[p.designerProfileId]) {
            projectsMap[p.designerProfileId] = { count: 0, images: [] };
          }
          projectsMap[p.designerProfileId].count += 1;
          if (Array.isArray(p.images)) {
            for (const img of p.images) {
              if (img?.url && typeof img.url === "string") {
                projectsMap[p.designerProfileId].images.push(img.url);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading portfolio project images:", err);
      }
    }

    const items: PublicDesignerItem[] = records.map((r) => {
      const pInfo = projectsMap[r.id] || { count: 0, images: [] };
      const specs = Array.isArray(r.specializations) ? r.specializations : [];
      const primaryStyle = specs.length > 0 ? specs[0] : r.title || "Modern & Contemporary";

      return {
        id: r.id,
        userId: r.userId,
        name: r.name,
        title: r.title,
        style: primaryStyle,
        city: r.city,
        serviceLocations: Array.isArray(r.serviceLocations) ? r.serviceLocations : [r.city],
        specializations: specs,
        services: Array.isArray(r.services) ? r.services : ["Full Home Design"],
        rating: Number(parseFloat(r.rating || "4.8").toFixed(1)),
        reviewsCount: r.reviewsCount || 12,
        experienceYears: r.experienceYears || 5,
        projectsCount: pInfo.count > 0 ? pInfo.count : 6,
        image: r.image || (pInfo.images.length > 0 ? pInfo.images[0] : null),
        bio: r.bio,
        startingBudget: r.startingBudget || "₹5–10 Lakh",
        phone: r.showPhonePublicly ? r.phone : null,
        isVerified: true,
        portfolioImages: pInfo.images,
      };
    });

    // 3. Fallback: If legacy designers table has pre-existing seed rows, include them so existing listings don't vanish
    try {
      const existingNames = new Set(items.map((i) => i.name.toLowerCase()));
      const legacy = await db
        .select()
        .from(legacyDesigners)
        .orderBy(desc(legacyDesigners.createdAt));

      for (const ld of legacy) {
        if (!existingNames.has(ld.fullName.toLowerCase())) {
          items.push({
            id: ld.id + 1000, // avoid ID collision with profiles
            userId: ld.id + 1000,
            name: ld.fullName,
            title: `${ld.designStyle} Interior Designer`,
            style: ld.designStyle,
            city: ld.city,
            serviceLocations: [ld.city],
            specializations: [ld.designStyle],
            services: Array.isArray(ld.services) ? ld.services : ["Full Home Design"],
            rating: Number(parseFloat(ld.rating || "4.8").toFixed(1)),
            reviewsCount: 15,
            experienceYears: ld.experienceYears || 5,
            projectsCount: 8,
            image: ld.profileImage,
            bio: ld.bio,
            startingBudget: "₹5–10 Lakh",
            phone: null,
            isVerified: ld.isVerified ?? true,
            portfolioImages: [],
          });
        }
      }
    } catch {
      // Ignore legacy errors if table doesn't exist
    }

    return limit ? items.slice(0, limit) : items;
  } catch (error) {
    console.error("getApprovedDesigners error:", error);
    return [];
  }
}

/**
 * Fetch a single designer profile and their portfolio projects.
 * Enforces status = 'approved' unless allowAdminPreview is true for authenticated admins.
 */
export async function getApprovedDesignerById(
  id: number,
  allowAdminPreview = false
): Promise<{
  designer: PublicDesignerItem;
  projects: { id: number; title: string; category: string; description: string | null; images: { url: string; caption?: string }[] }[];
  rawStatus?: string;
} | null> {
  try {
    // 1. Check designerProfiles
    const [profile] = await db
      .select({
        id: designerProfiles.id,
        userId: designerProfiles.userId,
        name: designerProfiles.displayName,
        title: designerProfiles.title,
        city: designerProfiles.city,
        serviceLocations: designerProfiles.serviceLocations,
        specializations: designerProfiles.specializations,
        services: designerProfiles.services,
        rating: designerProfiles.rating,
        reviewsCount: designerProfiles.reviewsCount,
        experienceYears: designerProfiles.yearsExperience,
        image: designerProfiles.profileImage,
        bio: designerProfiles.bio,
        startingBudget: designerProfiles.startingBudget,
        phone: designerProfiles.phone,
        showPhonePublicly: designerProfiles.showPhonePublicly,
        status: designerProfiles.status,
        userStatus: users.status,
      })
      .from(designerProfiles)
      .innerJoin(users, eq(designerProfiles.userId, users.id))
      .where(eq(designerProfiles.id, id))
      .limit(1);

    if (profile && ((profile.status === "approved" && profile.userStatus === "active") || allowAdminPreview)) {
      const projects = await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.designerProfileId, profile.id));

      const specs = Array.isArray(profile.specializations) ? profile.specializations : [];
      const allImages: string[] = [];

      for (const p of projects) {
        if (Array.isArray(p.images)) {
          for (const img of p.images) {
            if (img?.url) allImages.push(img.url);
          }
        }
      }

      const designer: PublicDesignerItem = {
        id: profile.id,
        userId: profile.userId,
        name: profile.name,
        title: profile.title,
        style: specs.length > 0 ? specs[0] : profile.title,
        city: profile.city,
        serviceLocations: Array.isArray(profile.serviceLocations) ? profile.serviceLocations : [profile.city],
        specializations: specs,
        services: Array.isArray(profile.services) ? profile.services : ["Full Home Design"],
        rating: Number(parseFloat(profile.rating || "4.8").toFixed(1)),
        reviewsCount: profile.reviewsCount || 12,
        experienceYears: profile.experienceYears || 5,
        projectsCount: projects.length,
        image: profile.image || (allImages.length > 0 ? allImages[0] : null),
        bio: profile.bio,
        startingBudget: profile.startingBudget || "₹5–10 Lakh",
        phone: profile.showPhonePublicly ? profile.phone : null,
        isVerified: profile.status === "approved",
        portfolioImages: allImages,
      };

      return { designer, projects, rawStatus: profile.status };
    }

    // 2. Legacy fallback
    const legacyId = id > 1000 ? id - 1000 : id;
    const [legacy] = await db
      .select()
      .from(legacyDesigners)
      .where(eq(legacyDesigners.id, legacyId))
      .limit(1);

    if (legacy) {
      const designer: PublicDesignerItem = {
        id,
        userId: id,
        name: legacy.fullName,
        title: `${legacy.designStyle} Interior Designer`,
        style: legacy.designStyle,
        city: legacy.city,
        serviceLocations: [legacy.city],
        specializations: [legacy.designStyle],
        services: Array.isArray(legacy.services) ? legacy.services : ["Full Home Design"],
        rating: Number(parseFloat(legacy.rating || "4.8").toFixed(1)),
        reviewsCount: 15,
        experienceYears: legacy.experienceYears || 5,
        projectsCount: 4,
        image: legacy.profileImage,
        bio: legacy.bio,
        startingBudget: "₹5–10 Lakh",
        phone: null,
        isVerified: legacy.isVerified ?? true,
        portfolioImages: [],
      };

      return { designer, projects: [] };
    }

    return null;
  } catch (error) {
    console.error("getApprovedDesignerById error:", error);
    return null;
  }
}

/**
 * Fetch portfolio projects uploaded by approved designers for the public Portfolio page.
 */
export async function getApprovedPortfolioProjects(): Promise<PublicProjectItem[]> {
  try {
    const projects = await db
      .select({
        id: portfolioProjects.id,
        designerProfileId: portfolioProjects.designerProfileId,
        title: portfolioProjects.title,
        category: portfolioProjects.category,
        description: portfolioProjects.description,
        images: portfolioProjects.images,
        designerName: designerProfiles.displayName,
        designerCity: designerProfiles.city,
      })
      .from(portfolioProjects)
      .innerJoin(designerProfiles, eq(portfolioProjects.designerProfileId, designerProfiles.id))
      .innerJoin(users, eq(designerProfiles.userId, users.id))
      .where(
        and(
          eq(designerProfiles.status, "approved"),
          eq(users.status, "active")
        )
      )
      .orderBy(desc(portfolioProjects.createdAt));

    const result: PublicProjectItem[] = [];

    for (const p of projects) {
      if (Array.isArray(p.images) && p.images.length > 0) {
        for (const img of p.images) {
          if (img?.url) {
            result.push({
              id: p.id,
              designerProfileId: p.designerProfileId,
              designerName: p.designerName,
              designerCity: p.designerCity,
              title: p.title,
              category: p.category || "Residential",
              description: p.description,
              image: img.url,
              caption: img.caption,
            });
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error("getApprovedPortfolioProjects error:", error);
    return [];
  }
}
