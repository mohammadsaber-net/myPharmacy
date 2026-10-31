import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const productTypeEnum = pgEnum('product_type', [
  'medicine', 'medical_supply', 'cosmetics', 'health_product',
]);
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['cash_on_delivery']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'paid', 'refunded']);
export const requestStatusEnum = pgEnum('request_status', ['new', 'contacted', 'fulfilled', 'rejected']);
export const messageStatusEnum = pgEnum('message_status', ['unread', 'read', 'replied', 'archived']);
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'initial', 'restock', 'sale', 'order_cancelled', 'adjustment',
]);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex('admins_email_unique').on(table.email)]);

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('admin_sessions_token_hash_unique').on(table.tokenHash), index('admin_sessions_admin_id_idx').on(table.adminId)]);

export const adminLoginAttempts = pgTable('admin_login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('admin_login_attempts_fingerprint_time_idx').on(table.fingerprint, table.attemptedAt)]);

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex('categories_slug_unique').on(table.slug), index('categories_active_sort_idx').on(table.isActive, table.sortOrder)]);

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 220 }).notNull(),
  slug: varchar('slug', { length: 240 }).notNull(),
  description: text('description'),
  sku: varchar('sku', { length: 80 }),
  type: productTypeEnum('type').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 5, scale: 2 }).notNull().default('0'),
  quantity: integer('quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  requiresPrescription: boolean('requires_prescription').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
}, (table) => [
  uniqueIndex('products_slug_unique').on(table.slug),
  uniqueIndex('products_sku_unique').on(table.sku),
  index('products_category_active_idx').on(table.categoryId, table.isActive),
  index('products_name_idx').on(table.name),
  check('products_price_nonnegative_check', sql`${table.price} >= 0`),
  check('products_discount_range_check', sql`${table.discount} >= 0 AND ${table.discount} <= 100`),
  check('products_quantity_nonnegative_check', sql`${table.quantity} >= 0`),
  check('products_low_stock_nonnegative_check', sql`${table.lowStockThreshold} >= 0`),
]);

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  publicId: text('public_id'),
  altText: varchar('alt_text', { length: 220 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('product_images_product_sort_idx').on(table.productId, table.sortOrder)]);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 32 }).notNull(),
  customerName: varchar('customer_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address').notNull(),
  notes: text('notes'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EGP'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash_on_delivery'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
  status: orderStatusEnum('status').notNull().default('pending'),
  ...timestamps,
}, (table) => [uniqueIndex('orders_order_number_unique').on(table.orderNumber), index('orders_status_created_idx').on(table.status, table.createdAt), index('orders_phone_idx').on(table.phone), check('orders_amounts_nonnegative_check', sql`${table.subtotal} >= 0 AND ${table.deliveryFee} >= 0 AND ${table.total} >= 0`)]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 220 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
}, (table) => [index('order_items_order_idx').on(table.orderId), check('order_items_quantity_positive_check', sql`${table.quantity} > 0`), check('order_items_amounts_nonnegative_check', sql`${table.unitPrice} >= 0 AND ${table.lineTotal} >= 0`)]);

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  movementType: inventoryMovementTypeEnum('movement_type').notNull(),
  quantityChange: integer('quantity_change').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('inventory_movements_product_created_idx').on(table.productId, table.createdAt)]);

export const productRequests = pgTable('product_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  productName: varchar('product_name', { length: 220 }).notNull(),
  details: text('details'),
  status: requestStatusEnum('status').notNull().default('new'),
  adminNotes: text('admin_notes'),
  ...timestamps,
}, (table) => [index('product_requests_status_created_idx').on(table.status, table.createdAt)]);

export const customerMessages = pgTable('customer_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  subject: varchar('subject', { length: 180 }),
  message: text('message').notNull(),
  status: messageStatusEnum('status').notNull().default('unread'),
  adminReply: text('admin_reply'),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [index('customer_messages_status_created_idx').on(table.status, table.createdAt)]);

// Reserved for future structured product metadata; keep sensitive prescription data out of public product records.
export const productMetadata = pgTable('product_metadata', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('product_metadata_product_unique').on(table.productId)]);

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
