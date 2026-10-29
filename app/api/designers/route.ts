import { NextRequest, NextResponse } from "next/server";
import { getApprovedDesigners } from "@/lib/designers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim().toLowerCase();
    const style = searchParams.get("style")?.trim().toLowerCase();
    const service = searchParams.get("service")?.trim().toLowerCase();
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Authoritative query: retrieves only approved, active designers
    let designers = await getApprovedDesigners();

    if (city && city !== "all") {
      designers = designers.filter(
        (d) =>
          d.city.toLowerCase() === city ||
          d.serviceLocations.some((loc) => loc.toLowerCase() === city)
      );
    }

    if (style && style !== "all") {
      designers = designers.filter(
        (d) =>
          d.style.toLowerCase().includes(style) ||
          d.specializations.some((s) => s.toLowerCase().includes(style))
      );
    }

    if (service && service !== "all") {
      designers = designers.filter((d) =>
        d.services.some((s) => s.toLowerCase().includes(service))
      );
    }

    if (search) {
      designers = designers.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.city.toLowerCase().includes(search) ||
          d.style.toLowerCase().includes(search) ||
          d.specializations.some((s) => s.toLowerCase().includes(search))
      );
    }

    // Map to the shape expected by frontend cards and components
    const mapped = designers.map((d) => ({
      id: d.id,
      name: d.name,
      style: d.style,
      city: d.city,
      rating: d.rating,
      experienceYears: d.experienceYears,
      projects: d.projectsCount,
      services: d.services,
      image: d.image,
      bio: d.bio,
      startingBudget: d.startingBudget,
      isVerified: d.isVerified,
    }));

    return NextResponse.json(mapped, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("GET /api/designers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch approved designers." },
      { status: 500 }
    );
  }
}