CREATE TYPE "product_type" AS ENUM ('medicine', 'medical_supply', 'cosmetics', 'health_product');
--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM ('cash_on_delivery');
--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM ('unpaid', 'paid', 'refunded');
--> statement-breakpoint
CREATE TYPE "request_status" AS ENUM ('new', 'contacted', 'fulfilled', 'rejected');
--> statement-breakpoint
CREATE TYPE "message_status" AS ENUM ('unread', 'read', 'replied', 'archived');
--> statement-breakpoint
CREATE TYPE "inventory_movement_type" AS ENUM ('initial', 'restock', 'sale', 'order_cancelled', 'adjustment');
--> statement-breakpoint

CREATE TABLE "admins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" varchar(160) NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_login_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_unique" ON "admins" USING btree ("email");
--> statement-breakpoint

CREATE TABLE "admin_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" uuid NOT NULL REFERENCES "admins"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_hash_unique" ON "admin_sessions" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions" USING btree ("admin_id");
--> statement-breakpoint

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "categories_active_sort_idx" ON "categories" USING btree ("is_active", "sort_order");
--> statement-breakpoint

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "name" varchar(220) NOT NULL,
  "slug" varchar(240) NOT NULL,
  "description" text,
  "sku" varchar(80),
  "type" "product_type" NOT NULL,
  "price" numeric(12,2) NOT NULL,
  "discount" numeric(5,2) DEFAULT '0' NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "low_stock_threshold" integer DEFAULT 5 NOT NULL,
  "requires_prescription" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "products_price_nonnegative_check" CHECK ("price" >= 0),
  CONSTRAINT "products_discount_range_check" CHECK ("discount" >= 0 AND "discount" <= 100),
  CONSTRAINT "products_quantity_nonnegative_check" CHECK ("quantity" >= 0),
  CONSTRAINT "products_low_stock_nonnegative_check" CHECK ("low_stock_threshold" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique" ON "products" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_unique" ON "products" USING btree ("sku");
--> statement-breakpoint
CREATE INDEX "products_category_active_idx" ON "products" USING btree ("category_id", "is_active");
--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");
--> statement-breakpoint

CREATE TABLE "product_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "public_id" text,
  "alt_text" varchar(220),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_images_product_sort_idx" ON "product_images" USING btree ("product_id", "sort_order");
--> statement-breakpoint

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_number" varchar(32) NOT NULL,
  "customer_name" varchar(160) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "address" text NOT NULL,
  "notes" text,
  "subtotal" numeric(12,2) NOT NULL,
  "delivery_fee" numeric(12,2) DEFAULT '0' NOT NULL,
  "total" numeric(12,2) NOT NULL,
  "currency" varchar(3) DEFAULT 'EGP' NOT NULL,
  "payment_method" "payment_method" DEFAULT 'cash_on_delivery' NOT NULL,
  "payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
  "status" "order_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "orders_amounts_nonnegative_check" CHECK ("subtotal" >= 0 AND "delivery_fee" >= 0 AND "total" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_unique" ON "orders" USING btree ("order_number");
--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");
--> statement-breakpoint

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "product_name" varchar(220) NOT NULL,
  "unit_price" numeric(12,2) NOT NULL,
  "quantity" integer NOT NULL,
  "line_total" numeric(12,2) NOT NULL,
  CONSTRAINT "order_items_quantity_positive_check" CHECK ("quantity" > 0),
  CONSTRAINT "order_items_amounts_nonnegative_check" CHECK ("unit_price" >= 0 AND "line_total" >= 0)
);
--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");
--> statement-breakpoint

CREATE TABLE "inventory_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "movement_type" "inventory_movement_type" NOT NULL,
  "quantity_change" integer NOT NULL,
  "quantity_after" integer NOT NULL,
  "note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "inventory_movements_product_created_idx" ON "inventory_movements" USING btree ("product_id", "created_at");
--> statement-breakpoint

CREATE TABLE "product_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_name" varchar(160) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "product_name" varchar(220) NOT NULL,
  "details" text,
  "status" "request_status" DEFAULT 'new' NOT NULL,
  "admin_notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_requests_status_created_idx" ON "product_requests" USING btree ("status", "created_at");
--> statement-breakpoint

CREATE TABLE "customer_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_name" varchar(160) NOT NULL,
  "phone" varchar(20),
  "email" varchar(255),
  "subject" varchar(180),
  "message" text NOT NULL,
  "status" "message_status" DEFAULT 'unread' NOT NULL,
  "admin_reply" text,
  "replied_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "customer_messages_status_created_idx" ON "customer_messages" USING btree ("status", "created_at");
--> statement-breakpoint

CREATE TABLE "product_metadata" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_metadata_product_unique" ON "product_metadata" USING btree ("product_id");
--> statement-breakpoint
