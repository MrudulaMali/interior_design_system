import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { hashPassword } from "../lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  // 1. Provision initial Administrator securely from environment variables
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@interiorfinder.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecurePass2026!";
  const adminHash = await hashPassword(adminPassword);

  const existingAdmin = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(schema.users).values({
      fullName: "System Administrator",
      email: adminEmail,
      phone: "+91 9999999999",
      passwordHash: adminHash,
      role: "admin",
      status: "active",
    });
    console.log(`✓ Admin provisioned: ${adminEmail}`);
  } else {
    console.log(`- Admin already exists: ${adminEmail}`);
  }

  // 2. Provision Demo Customer Account
  const customerEmail = "customer@interiorfinder.com";
  const customerPassword = "CustomerPass123!";
  const customerHash = await hashPassword(customerPassword);

  const existingCustomer = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, customerEmail))
    .limit(1);

  if (existingCustomer.length === 0) {
    await db.insert(schema.users).values({
      fullName: "Aarav Desai",
      email: customerEmail,
      phone: "+91 9876543210",
      passwordHash: customerHash,
      role: "customer",
      status: "active",
    });
    console.log(`✓ Customer created: ${customerEmail}`);
  } else {
    console.log(`- Customer already exists: ${customerEmail}`);
  }

  // 3. Provision Demo Designer Account & Profile
  const designerEmail = "riya.sharma@interiorfinder.com";
  const designerPassword = "DesignerPass123!";
  const designerHash = await hashPassword(designerPassword);

  const existingDesigner = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, designerEmail))
    .limit(1);

  let designerUserId: number;

  if (existingDesigner.length === 0) {
    const [createdDesigner] = await db
      .insert(schema.users)
      .values({
        fullName: "Riya Sharma",
        email: designerEmail,
        phone: "+91 9822001122",
        passwordHash: designerHash,
        role: "designer",
        status: "active",
      })
      .returning({ id: schema.users.id });
    designerUserId = createdDesigner.id;
    console.log(`✓ Designer account created: ${designerEmail}`);
  } else {
    designerUserId = existingDesigner[0].id;
    console.log(`- Designer user exists: ${designerEmail}`);
  }

  // 4. Create Designer Profile if not existing
  const existingProfile = await db
    .select({ id: schema.designerProfiles.id })
    .from(schema.designerProfiles)
    .where(eq(schema.designerProfiles.userId, designerUserId))
    .limit(1);

  if (existingProfile.length === 0) {
    const [profile] = await db
      .insert(schema.designerProfiles)
      .values({
        userId: designerUserId,
        displayName: "Riya Sharma Designs",
        title: "Principal Designer & Space Planner",
        bio: "Specializing in warm minimal and contemporary residential spaces. Over 8 years transforming apartments and luxury villas into functional homes.",
        phone: "+91 9822001122",
        showPhonePublicly: true,
        city: "Pune",
        serviceLocations: ["Pune", "Mumbai", "PCMC"],
        yearsExperience: 8,
        specializations: ["Modern & Minimal", "Warm Contemporary", "Modular Kitchens"],
        services: ["Full Home Design", "Space Planning", "Modular Kitchen", "Turnkey Execution"],
        projectTypes: ["2 BHK & 3 BHK Apartments", "Villas", "Penthouses"],
        profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
        startingBudget: "₹5–10 lakh",
        status: "approved",
        rating: "4.9",
        reviewsCount: 48,
      })
      .returning({ id: schema.designerProfiles.id });

    // Add sample portfolio project
    await db.insert(schema.portfolioProjects).values({
      designerProfileId: profile.id,
      title: "Warm Minimal 3 BHK at Baner",
      category: "Residential",
      description: "Complete turnkey design with custom white oak cabinetry, concealed mood lighting, and Italian marble flooring.",
      images: [
        { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80", caption: "Living Room & Balcony Deck" },
        { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80", caption: "Open Modular Kitchen" },
      ],
    });

    console.log(`✓ Designer profile & portfolio created for Riya Sharma.`);
  }

  console.log("\nSeeding complete!");
  console.log("-----------------------------------------");
  console.log("Default provisioned credentials:");
  console.log(`Admin:    ${adminEmail} / (set in ADMIN_PASSWORD or 'AdminSecurePass2026!')`);
  console.log(`Customer: ${customerEmail} / CustomerPass123!`);
  console.log(`Designer: ${designerEmail} / DesignerPass123!`);
  console.log("-----------------------------------------");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
