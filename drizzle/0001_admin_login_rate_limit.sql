CREATE TABLE IF NOT EXISTS "admin_login_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fingerprint" varchar(64) NOT NULL,
  "attempted_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_login_attempts_fingerprint_time_idx"
  ON "admin_login_attempts" USING btree ("fingerprint", "attempted_at");
