import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "contacted",
  "in_progress",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 30 }).notNull().default("customer"), // 'admin' | 'customer' | 'designer'
  status: varchar("status", { length: 30 }).notNull().default("active"), // 'active' | 'suspended'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const designerProfiles = pgTable("designer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  bio: text("bio"),
  phone: varchar("phone", { length: 20 }),
  showPhonePublicly: boolean("show_phone_publicly").default(false).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  serviceLocations: jsonb("service_locations")
    .$type<string[]>()
    .default([])
    .notNull(),
  yearsExperience: integer("years_experience").default(0).notNull(),
  specializations: jsonb("specializations")
    .$type<string[]>()
    .default([])
    .notNull(),
  services: jsonb("services").$type<string[]>().default([]).notNull(),
  projectTypes: jsonb("project_types").$type<string[]>().default([]).notNull(),
  profileImage: text("profile_image"),
  startingBudget: varchar("starting_budget", { length: 100 }),
  status: varchar("status", { length: 30 }).default("pending").notNull(), // 'draft' | 'pending' | 'approved' | 'rejected'
  rejectionReason: text("rejection_reason"),
  rating: varchar("rating", { length: 10 }).default("4.8").notNull(),
  reviewsCount: integer("reviews_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const portfolioProjects = pgTable("portfolio_projects", {
  id: serial("id").primaryKey(),
  designerProfileId: integer("designer_profile_id")
    .notNull()
    .references(() => designerProfiles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 150 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  images: jsonb("images")
    .$type<{ url: string; caption?: string }[]>()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  assignedDesignerId: integer("assigned_designer_id").references(
    () => users.id,
    { onDelete: "set null" }
  ),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  city: varchar("city", { length: 150 }).notNull(),
  contactMethod: varchar("contact_method", { length: 30 })
    .notNull()
    .default("Phone"),
  propertyType: varchar("property_type", { length: 100 }).notNull(),
  propertySize: varchar("property_size", { length: 50 }),
  bedrooms: varchar("bedrooms", { length: 50 }),
  designStyle: varchar("design_style", { length: 100 }),
  rooms: jsonb("rooms").$type<string[]>().default([]).notNull(),
  budget: varchar("budget", { length: 100 }).notNull(),
  startDate: varchar("start_date", { length: 50 }),
  description: text("description"),
  status: enquiryStatusEnum("status")
    .notNull()
    .default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;
export type EnquiryStatus = (typeof enquiryStatusEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type DesignerProfile = typeof designerProfiles.$inferSelect;
export type NewDesignerProfile = typeof designerProfiles.$inferInsert;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type NewPortfolioProject = typeof portfolioProjects.$inferInsert;
