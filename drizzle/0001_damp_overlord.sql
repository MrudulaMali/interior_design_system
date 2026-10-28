CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'contacted', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "property_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "budget" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enquiry_status";--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "status" SET DATA TYPE "public"."enquiry_status" USING "status"::"public"."enquiry_status";--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enquiries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "full_name" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "city" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "contact_method" varchar(30) DEFAULT 'Phone' NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "property_size" varchar(50);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "bedrooms" varchar(50);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "design_style" varchar(100);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "rooms" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "start_date" varchar(50);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" DROP COLUMN "customer_name";--> statement-breakpoint
ALTER TABLE "enquiries" DROP COLUMN "message";