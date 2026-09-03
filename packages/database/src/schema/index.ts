import { pgTable, uuid, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  businessName: text('business_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentIntents = pgTable('payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  asset: text('asset').notNull(),
  recipient: text('recipient').notNull(),
  status: text('status').notNull().default('CREATED'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  expiresAt: timestamp('expires_at'),
  transactionHash: text('transaction_hash'),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentIntentId: uuid('payment_intent_id').notNull().references(() => paymentIntents.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  asset: text('asset').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  transactionHash: text('transaction_hash').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  description: text('description'),
  amount: text('amount').notNull(),
  asset: text('asset').notNull(),
  status: text('status').notNull().default('DRAFT'),
  dueDate: timestamp('due_date'),
  paymentIntentId: uuid('payment_intent_id').references(() => paymentIntents.id),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: jsonb('events').$type<string[]>().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').$type<Record<string, any>>().notNull(),
  statusCode: integer('status_code'),
  response: text('response'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  nextRetryAt: timestamp('next_retry_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  merchants: many(merchants),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  apiKeys: many(apiKeys),
  paymentIntents: many(paymentIntents),
  invoices: many(invoices),
  webhooks: many(webhooks),
  auditLogs: many(auditLogs),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  merchant: one(merchants, {
    fields: [apiKeys.merchantId],
    references: [merchants.id],
  }),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [paymentIntents.merchantId],
    references: [merchants.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  paymentIntent: one(paymentIntents, {
    fields: [payments.paymentIntentId],
    references: [paymentIntents.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  merchant: one(merchants, {
    fields: [invoices.merchantId],
    references: [merchants.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [invoices.paymentIntentId],
    references: [paymentIntents.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [webhooks.merchantId],
    references: [merchants.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  merchant: one(merchants, {
    fields: [auditLogs.merchantId],
    references: [merchants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
