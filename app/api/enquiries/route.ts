import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql, and, or } from "drizzle-orm";
import { db } from "@/db";
import { enquiries, EnquiryStatus } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

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

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required to view enquiries." },
        { status: 401 }
      );
    }

    let filterCondition = undefined;

    // Role-based scoping
    if (currentUser.role === "admin") {
      // Administrators can view all enquiries
      filterCondition = undefined;
    } else if (currentUser.role === "designer") {
      // Designers view strictly enquiries assigned specifically to them
      filterCondition = eq(enquiries.assignedDesignerId, currentUser.id);
    } else {
      // Customers view strictly their own submitted enquiries
      filterCondition = or(
        eq(enquiries.customerId, currentUser.id),
        eq(enquiries.email, currentUser.email)
      );
    }

    const query = db
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt))
      .limit(200);

    const countQuery = db
      .select({
        status: enquiries.status,
        count: sql<number>`count(*)::int`,
      })
      .from(enquiries)
      .groupBy(enquiries.status);

    const [allEnquiries, statusCounts] = await Promise.all([
      filterCondition ? query.where(filterCondition) : query,
      filterCondition ? countQuery.where(filterCondition) : countQuery,
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
      role: currentUser.role,
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

    const currentUser = await getCurrentUser();
    const customerId = currentUser ? currentUser.id : null;
    const assignedDesignerId =
      typeof body.assignedDesignerId === "number" && body.assignedDesignerId > 0
        ? body.assignedDesignerId
        : null;

    const [created] = await db
      .insert(enquiries)
      .values({
        customerId,
        assignedDesignerId,
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
      { message: "Enquiry submitted successfully.", enquiry: created },
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!isObject(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const id = Number(body.id);
    const status = body.status as EnquiryStatus;
    const assignedDesignerId = body.assignedDesignerId !== undefined
      ? (body.assignedDesignerId ? Number(body.assignedDesignerId) : null)
      : undefined;

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Valid enquiry ID is required." }, { status: 400 });
    }

    // Retrieve enquiry to verify permissions
    const [target] = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, id))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Role-based authorization & permission validation:
    // - Admin: can update any status and assign/reassign assignedDesignerId
    // - Designer: can strictly only update status of enquiries assigned to them
    // - Customer: can strictly only cancel ('cancelled') their own pending/contacted enquiries
    if (currentUser.role === "designer") {
      if (target.assignedDesignerId !== currentUser.id) {
        return NextResponse.json(
          { error: "Access denied. You can only update enquiries assigned to you." },
          { status: 403 }
        );
      }
      if (status && allowedStatuses.includes(status)) {
        updates.status = status;
      }
    } else if (currentUser.role === "customer") {
      const isOwner =
        target.customerId === currentUser.id ||
        target.email.toLowerCase() === currentUser.email.toLowerCase();

      if (!isOwner) {
        return NextResponse.json(
          { error: "Access denied. You can only manage your own enquiries." },
          { status: 403 }
        );
      }

      if (status === "cancelled") {
        if (target.status !== "new" && target.status !== "contacted") {
          return NextResponse.json(
            { error: "This enquiry is already in progress or completed and cannot be cancelled." },
            { status: 400 }
          );
        }
        updates.status = "cancelled";
      } else {
        return NextResponse.json(
          { error: "Customers may only cancel pending enquiries." },
          { status: 403 }
        );
      }
    } else if (currentUser.role === "admin") {
      if (status && allowedStatuses.includes(status)) {
        updates.status = status;
      }
      if (assignedDesignerId !== undefined) {
        updates.assignedDesignerId = assignedDesignerId;
      }
    } else {
      return NextResponse.json(
        { error: "Unauthorized operation." },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(enquiries)
      .set(updates)
      .where(eq(enquiries.id, id))
      .returning();

    return NextResponse.json({
      message: "Enquiry updated successfully.",
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Valid enquiry ID is required." }, { status: 400 });
    }

    const [target] = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, id))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    // Only Admin or the owning customer can delete their enquiry
    if (currentUser.role !== "admin" && target.customerId !== currentUser.id) {
      return NextResponse.json(
        { error: "Access denied. You can only delete your own enquiry." },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(enquiries)
      .where(eq(enquiries.id, id))
      .returning();

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
