ALTER TABLE "products" ADD COLUMN "scientific_name" varchar(220) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "english_name" varchar(220) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "scientific_name" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "english_name" DROP DEFAULT;
