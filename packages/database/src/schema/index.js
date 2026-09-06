"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRelations = exports.webhookDeliveriesRelations = exports.webhooksRelations = exports.invoicesRelations = exports.paymentsRelations = exports.paymentIntentsRelations = exports.apiKeysRelations = exports.merchantsRelations = exports.usersRelations = exports.auditLogs = exports.webhookDeliveries = exports.webhooks = exports.invoices = exports.payments = exports.paymentIntents = exports.apiKeys = exports.merchants = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.merchants = (0, pg_core_1.pgTable)('merchants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    businessName: (0, pg_core_1.text)('business_name'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.apiKeys = (0, pg_core_1.pgTable)('api_keys', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    merchantId: (0, pg_core_1.uuid)('merchant_id').notNull().references(() => exports.merchants.id, { onDelete: 'cascade' }),
    keyHash: (0, pg_core_1.text)('key_hash').notNull(),
    keyPrefix: (0, pg_core_1.text)('key_prefix').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.paymentIntents = (0, pg_core_1.pgTable)('payment_intents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    merchantId: (0, pg_core_1.uuid)('merchant_id').notNull().references(() => exports.merchants.id, { onDelete: 'cascade' }),
    amount: (0, pg_core_1.text)('amount').notNull(),
    asset: (0, pg_core_1.text)('asset').notNull(),
    recipient: (0, pg_core_1.text)('recipient').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('CREATED'),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    transactionHash: (0, pg_core_1.text)('transaction_hash'),
    idempotencyKey: (0, pg_core_1.text)('idempotency_key').unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    paymentIntentId: (0, pg_core_1.uuid)('payment_intent_id').notNull().references(() => exports.paymentIntents.id, { onDelete: 'cascade' }),
    amount: (0, pg_core_1.text)('amount').notNull(),
    asset: (0, pg_core_1.text)('asset').notNull(),
    fromAddress: (0, pg_core_1.text)('from_address').notNull(),
    toAddress: (0, pg_core_1.text)('to_address').notNull(),
    transactionHash: (0, pg_core_1.text)('transaction_hash').notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.invoices = (0, pg_core_1.pgTable)('invoices', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    merchantId: (0, pg_core_1.uuid)('merchant_id').notNull().references(() => exports.merchants.id, { onDelete: 'cascade' }),
    invoiceNumber: (0, pg_core_1.text)('invoice_number').notNull().unique(),
    customerName: (0, pg_core_1.text)('customer_name'),
    customerEmail: (0, pg_core_1.text)('customer_email'),
    description: (0, pg_core_1.text)('description'),
    amount: (0, pg_core_1.text)('amount').notNull(),
    asset: (0, pg_core_1.text)('asset').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('DRAFT'),
    dueDate: (0, pg_core_1.timestamp)('due_date'),
    paymentIntentId: (0, pg_core_1.uuid)('payment_intent_id').references(() => exports.paymentIntents.id),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.webhooks = (0, pg_core_1.pgTable)('webhooks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    merchantId: (0, pg_core_1.uuid)('merchant_id').notNull().references(() => exports.merchants.id, { onDelete: 'cascade' }),
    url: (0, pg_core_1.text)('url').notNull(),
    secret: (0, pg_core_1.text)('secret').notNull(),
    events: (0, pg_core_1.jsonb)('events').$type().notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.webhookDeliveries = (0, pg_core_1.pgTable)('webhook_deliveries', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    webhookId: (0, pg_core_1.uuid)('webhook_id').notNull().references(() => exports.webhooks.id, { onDelete: 'cascade' }),
    event: (0, pg_core_1.text)('event').notNull(),
    payload: (0, pg_core_1.jsonb)('payload').$type().notNull(),
    statusCode: (0, pg_core_1.integer)('status_code'),
    response: (0, pg_core_1.text)('response'),
    attemptNumber: (0, pg_core_1.integer)('attempt_number').notNull().default(1),
    nextRetryAt: (0, pg_core_1.timestamp)('next_retry_at'),
    deliveredAt: (0, pg_core_1.timestamp)('delivered_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    merchantId: (0, pg_core_1.uuid)('merchant_id').notNull().references(() => exports.merchants.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id),
    action: (0, pg_core_1.text)('action').notNull(),
    resourceType: (0, pg_core_1.text)('resource_type').notNull(),
    resourceId: (0, pg_core_1.text)('resource_id').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    merchants: many(exports.merchants),
}));
exports.merchantsRelations = (0, drizzle_orm_1.relations)(exports.merchants, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.merchants.userId],
        references: [exports.users.id],
    }),
    apiKeys: many(exports.apiKeys),
    paymentIntents: many(exports.paymentIntents),
    invoices: many(exports.invoices),
    webhooks: many(exports.webhooks),
    auditLogs: many(exports.auditLogs),
}));
exports.apiKeysRelations = (0, drizzle_orm_1.relations)(exports.apiKeys, ({ one }) => ({
    merchant: one(exports.merchants, {
        fields: [exports.apiKeys.merchantId],
        references: [exports.merchants.id],
    }),
}));
exports.paymentIntentsRelations = (0, drizzle_orm_1.relations)(exports.paymentIntents, ({ one, many }) => ({
    merchant: one(exports.merchants, {
        fields: [exports.paymentIntents.merchantId],
        references: [exports.merchants.id],
    }),
    payments: many(exports.payments),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(exports.payments, ({ one }) => ({
    paymentIntent: one(exports.paymentIntents, {
        fields: [exports.payments.paymentIntentId],
        references: [exports.paymentIntents.id],
    }),
}));
exports.invoicesRelations = (0, drizzle_orm_1.relations)(exports.invoices, ({ one }) => ({
    merchant: one(exports.merchants, {
        fields: [exports.invoices.merchantId],
        references: [exports.merchants.id],
    }),
    paymentIntent: one(exports.paymentIntents, {
        fields: [exports.invoices.paymentIntentId],
        references: [exports.paymentIntents.id],
    }),
}));
exports.webhooksRelations = (0, drizzle_orm_1.relations)(exports.webhooks, ({ one, many }) => ({
    merchant: one(exports.merchants, {
        fields: [exports.webhooks.merchantId],
        references: [exports.merchants.id],
    }),
    deliveries: many(exports.webhookDeliveries),
}));
exports.webhookDeliveriesRelations = (0, drizzle_orm_1.relations)(exports.webhookDeliveries, ({ one }) => ({
    webhook: one(exports.webhooks, {
        fields: [exports.webhookDeliveries.webhookId],
        references: [exports.webhooks.id],
    }),
}));
exports.auditLogsRelations = (0, drizzle_orm_1.relations)(exports.auditLogs, ({ one }) => ({
    merchant: one(exports.merchants, {
        fields: [exports.auditLogs.merchantId],
        references: [exports.merchants.id],
    }),
    user: one(exports.users, {
        fields: [exports.auditLogs.userId],
        references: [exports.users.id],
    }),
}));
//# sourceMappingURL=index.js.map