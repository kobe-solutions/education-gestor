ALTER TABLE "schools" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_email_unique" UNIQUE("email");