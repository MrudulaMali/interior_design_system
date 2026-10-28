
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "contacted",
  "in_progress",
  "completed",
  "cancelled",
]);

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
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
