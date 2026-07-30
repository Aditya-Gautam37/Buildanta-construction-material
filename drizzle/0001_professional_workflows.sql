ALTER TABLE `quote_requests` ADD `name` text;
--> statement-breakpoint
ALTER TABLE `quote_requests` ADD `phone` text;
--> statement-breakpoint
ALTER TABLE `quote_requests` ADD `required_by` text;
--> statement-breakpoint
ALTER TABLE `quote_requests` ADD `project_type` text;
--> statement-breakpoint
ALTER TABLE `quote_requests` ADD `notes` text;
--> statement-breakpoint
CREATE TABLE `supplier_submissions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `reference` text NOT NULL UNIQUE,
  `contact_name` text NOT NULL,
  `email` text NOT NULL,
  `phone` text NOT NULL,
  `company` text NOT NULL,
  `product_name` text NOT NULL,
  `brand` text NOT NULL,
  `category` text NOT NULL,
  `unit` text NOT NULL,
  `price` real NOT NULL,
  `stock` integer NOT NULL,
  `description` text NOT NULL,
  `image_key` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `supplier_submissions_status_idx` ON `supplier_submissions` (`status`);
--> statement-breakpoint
CREATE INDEX `supplier_submissions_email_idx` ON `supplier_submissions` (`email`);
--> statement-breakpoint
CREATE TABLE `inventory_overrides` (
  `slug` text PRIMARY KEY NOT NULL,
  `stock` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `actor_email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_audit` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL,
  `delta` integer NOT NULL,
  `reason` text NOT NULL,
  `actor_email` text NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inventory_audit_slug_idx` ON `inventory_audit` (`slug`);
