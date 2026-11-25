CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`aisle` text NOT NULL,
	`base_unit` text NOT NULL,
	`piece_grams` real,
	`kcal_per_100` real NOT NULL,
	`protein_g_per_100` real DEFAULT 0 NOT NULL,
	`carbs_g_per_100` real DEFAULT 0 NOT NULL,
	`fat_g_per_100` real DEFAULT 0 NOT NULL,
	`fiber_g_per_100` real DEFAULT 0 NOT NULL,
	`sodium_mg_per_100` real DEFAULT 0 NOT NULL,
	`default_price_inr` real NOT NULL,
	`price_basis` text NOT NULL,
	`diet_tags` text DEFAULT '[]' NOT NULL,
	`allergen_tags` text DEFAULT '[]' NOT NULL,
	`is_staple` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredients_name_unique` ON `ingredients` (`name`);--> statement-breakpoint
CREATE INDEX `ingredients_name_idx` ON `ingredients` (`name`);--> statement-breakpoint
CREATE INDEX `ingredients_aisle_idx` ON `ingredients` (`aisle`);--> statement-breakpoint
CREATE INDEX `ingredients_is_staple_idx` ON `ingredients` (`is_staple`);--> statement-breakpoint
CREATE TABLE `pincode_stores` (
	`pincode` text NOT NULL,
	`store_id` text NOT NULL,
	`confirmed_count` integer DEFAULT 0 NOT NULL,
	`last_confirmed_at` integer,
	PRIMARY KEY(`pincode`, `store_id`),
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pincode_stores_pincode_idx` ON `pincode_stores` (`pincode`);--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`ingredient_id` text,
	`raw_name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`grams` real,
	`optional` integer DEFAULT false NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_ingredients_recipe_sort_idx` ON `recipe_ingredients` (`recipe_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_recipe_idx` ON `recipe_ingredients` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_ingredient_idx` ON `recipe_ingredients` (`ingredient_id`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`cuisine` text NOT NULL,
	`diet` text NOT NULL,
	`meal_slots` text DEFAULT '[]' NOT NULL,
	`servings` integer NOT NULL,
	`prep_min` integer NOT NULL,
	`cook_min` integer NOT NULL,
	`steps` text DEFAULT '[]' NOT NULL,
	`image_url` text,
	`source_url` text,
	`source_type` text NOT NULL,
	`allergens` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_unique` ON `recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `recipes_slug_idx` ON `recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `recipes_diet_idx` ON `recipes` (`diet`);--> statement-breakpoint
CREATE INDEX `recipes_cuisine_idx` ON `recipes` (`cuisine`);--> statement-breakpoint
CREATE TABLE `store_confirmations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pincode` text NOT NULL,
	`store_id` text NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `store_confirmations_pincode_store_idx` ON `store_confirmations` (`pincode`,`store_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `store_confirmations_ip_idx` ON `store_confirmations` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`link_template` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stores_sort_order_idx` ON `stores` (`sort_order`);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS recipe_fts USING fts5(recipe_id UNINDEXED, title, description, tags, ingredients);
