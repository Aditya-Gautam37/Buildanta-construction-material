import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  unit: text("unit").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  imageKey: text("image_key"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("products_category_idx").on(table.category),
  index("products_active_idx").on(table.active),
]);

export const quoteRequests = sqliteTable("quote_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  name: text("name"),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company").notNull(),
  productId: integer("product_id").references(() => products.id),
  requirement: text("requirement").notNull(),
  quantity: integer("quantity").notNull(),
  deliveryPincode: text("delivery_pincode").notNull(),
  requiredBy: text("required_by"),
  projectType: text("project_type"),
  notes: text("notes"),
  status: text("status", { enum: ["new", "reviewing", "quoted", "accepted", "closed"] }).notNull().default("new"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("quote_requests_status_idx").on(table.status),
  index("quote_requests_email_idx").on(table.email),
]);

export const inventoryEvents = sqliteTable("inventory_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  actorEmail: text("actor_email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("inventory_events_product_idx").on(table.productId)]);

export const supplierSubmissions = sqliteTable("supplier_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company").notNull(),
  productName: text("product_name").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull(),
  description: text("description").notNull(),
  imageKey: text("image_key").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("supplier_submissions_status_idx").on(table.status),
  index("supplier_submissions_email_idx").on(table.email),
]);

export const inventoryOverrides = sqliteTable("inventory_overrides", {
  slug: text("slug").primaryKey(),
  stock: integer("stock").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  actorEmail: text("actor_email").notNull(),
});

export const inventoryAudit = sqliteTable("inventory_audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  actorEmail: text("actor_email").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("inventory_audit_slug_idx").on(table.slug)]);
