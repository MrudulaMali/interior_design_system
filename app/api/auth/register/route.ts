import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password, role } = body || {};

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Role safety: self-registration only allows 'customer' or 'designer'
    const assignedRole = role === "designer" ? "designer" : "customer";

    // Hash the password securely with bcrypt
    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: typeof phone === "string" ? phone.trim() : null,
        passwordHash,
        role: assignedRole,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      });

    // Establish authenticated session
    await createSession(newUser.id);

    const redirectUrl =
      newUser.role === "designer"
        ? "/designer/dashboard"
        : "/customer/dashboard";

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: newUser,
        redirectUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}
