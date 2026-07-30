CREATE TABLE `products` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `sku` text NOT NULL UNIQUE, `name` text NOT NULL, `category` text NOT NULL,
  `description` text NOT NULL, `unit` text NOT NULL, `price` real NOT NULL,
  `stock` integer DEFAULT 0 NOT NULL, `image_key` text,
  `active` integer DEFAULT true NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);
--> statement-breakpoint
CREATE INDEX `products_active_idx` ON `products` (`active`);
--> statement-breakpoint
CREATE TABLE `quote_requests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `reference` text NOT NULL UNIQUE,
  `email` text NOT NULL, `company` text NOT NULL, `product_id` integer,
  `requirement` text NOT NULL, `quantity` integer NOT NULL, `delivery_pincode` text NOT NULL,
  `status` text DEFAULT 'new' NOT NULL, `created_at` integer NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quote_requests_status_idx` ON `quote_requests` (`status`);
--> statement-breakpoint
CREATE INDEX `quote_requests_email_idx` ON `quote_requests` (`email`);
--> statement-breakpoint
CREATE TABLE `inventory_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `product_id` integer NOT NULL,
  `delta` integer NOT NULL, `reason` text NOT NULL, `actor_email` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_events_product_idx` ON `inventory_events` (`product_id`);
