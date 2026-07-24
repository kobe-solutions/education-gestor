ALTER TABLE "secretarias" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "secretarias" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "secretarias" ADD COLUMN "responsible" text;--> statement-breakpoint
ALTER TABLE "secretarias" ADD COLUMN "active" boolean DEFAULT true NOT NULL;