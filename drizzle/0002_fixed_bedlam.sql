CREATE TABLE "designers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"design_style" varchar(100) NOT NULL,
	"city" varchar(150) NOT NULL,
	"rating" numeric(2, 1) DEFAULT '0.0' NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"profile_image" text,
	"bio" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
