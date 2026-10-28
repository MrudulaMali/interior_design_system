import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { enquiries, enquiryStatusEnum, EnquiryStatus } from "@/db/schema";

const allowedStatuses: EnquiryStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "completed",
  "cancelled",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validString(
  value: unknown,
  maxLength: number,
  required = false
): value is string {
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    (!required || value.trim().length > 0)
  );
}

function validateEnquiry(body: unknown): string | null {
  if (!isObject(body)) return "Invalid request body.";

  const requiredFields = [
    ["fullName", 150],
    ["email", 255],
    ["phone", 20],
    ["city", 150],
    ["propertyType", 100],
    ["budget", 100],
  ] as const;

  for (const [field, maxLength] of requiredFields) {
    if (!validString(body[field], maxLength, true)) {
      return `Please provide a valid ${field}.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email as string)) {
    return "Please enter a valid email address.";
  }

  if (!/^[0-9+\-() ]{7,20}$/.test(body.phone as string)) {
    return "Please enter a valid phone number.";
  }

  const optionalFields = [
    ["contactMethod", 30],
    ["propertySize", 50],
    ["bedrooms", 50],
    ["designStyle", 100],
    ["startDate", 50],
    ["description", 3000],
  ] as const;

  for (const [field, maxLength] of optionalFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      !validString(body[field], maxLength)
    ) {
      return `Invalid ${field}.`;
    }
  }

  if (
    body.rooms !== undefined &&
    body.rooms !== null &&
    (!Array.isArray(body.rooms) ||
      body.rooms.length > 20 ||
      !body.rooms.every((room) => typeof room === "string"))
  ) {
    return "Invalid room selection.";
  }

  return null;
}

export async function GET() {
  try {
    const [allEnquiries, statusCounts] = await Promise.all([
      db
        .select()
        .from(enquiries)
        .orderBy(desc(enquiries.createdAt))
        .limit(200),

      db
        .select({
          status: enquiries.status,
          count: sql<number>`count(*)::int`,
        })
        .from(enquiries)
        .groupBy(enquiries.status),
    ]);

    const counts: Record<string, number> = {
      total: 0,
      new: 0,
      contacted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const item of statusCounts) {
      if (item.status && item.status in counts) {
        counts[item.status] = item.count;
      }
      counts.total += item.count;
    }

    return NextResponse.json({
      enquiries: allEnquiries,
      counts,
    });
  } catch (error) {
    console.error("GET enquiries error:", error);

    return NextResponse.json(
      { error: "Unable to load enquiries." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validationError = validateEnquiry(body);

    if (validationError || !isObject(body)) {
      return NextResponse.json(
        { error: validationError ?? "Invalid request." },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(enquiries)
      .values({
        fullName: (body.fullName as string).trim(),
        email: (body.email as string).trim().toLowerCase(),
        phone: (body.phone as string).trim(),
        city: (body.city as string).trim(),
        contactMethod: (body.contactMethod as string) || "Phone",
        propertyType: (body.propertyType as string).trim(),
        propertySize: (body.propertySize as string)?.trim() || null,
        bedrooms: (body.bedrooms as string)?.trim() || null,
        designStyle: (body.designStyle as string)?.trim() || null,
        rooms: Array.isArray(body.rooms) ? (body.rooms as string[]) : [],
        budget: (body.budget as string).trim(),
        startDate: (body.startDate as string)?.trim() || null,
        description: (body.description as string)?.trim() || null,
        status: "new",
      })
      .returning();

    return NextResponse.json(
      { message: "Enquiry created successfully.", enquiry: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST enquiry error:", error);

    return NextResponse.json(
      { error: "Unable to save enquiry." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isObject(body)) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const id = Number(body.id);
    const status = body.status as EnquiryStatus;

    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid enquiry ID and status are required." },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(enquiries)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Enquiry not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Enquiry status updated.",
      enquiry: updated,
    });
  } catch (error) {
    console.error("PATCH enquiry error:", error);

    return NextResponse.json(
      { error: "Unable to update enquiry." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = Number(idParam);

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Valid enquiry ID is required." },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(enquiries)
      .where(eq(enquiries.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Enquiry not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Enquiry deleted successfully.",
      enquiry: deleted,
    });
  } catch (error) {
    console.error("DELETE enquiry error:", error);

    return NextResponse.json(
      { error: "Unable to delete enquiry." },
      { status: 500 }
    );
  }
}
