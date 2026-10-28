CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"property_type" varchar(100),
	"budget" varchar(100),
	"message" text,
	"status" varchar(30) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
