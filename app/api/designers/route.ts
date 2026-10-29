
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { designers } from "@/db/schema";

export async function GET() {
  try {
    const records = await db
      .select()
      .from(designers)
      .orderBy(desc(designers.createdAt));

    return NextResponse.json(records, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching designers:", error);

    return NextResponse.json(
      { error: "Failed to fetch designers from database." },
      { status: 500 },
    );
  }
}
