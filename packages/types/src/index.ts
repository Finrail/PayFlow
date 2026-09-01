export type PaymentStatus = 'CREATED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'EXPIRED' | 'CANCELLED';
export type WebhookEvent = 
  | 'payment.created'
  | 'payment.pending'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'payment.expired'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.expired';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Merchant {
  id: string;
  userId: string;
  name: string;
  businessName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  merchantId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  merchantId: string;
  amount: string;
  asset: string;
  recipient: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  transactionHash?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  paymentIntentId: string;
  amount: string;
  asset: string;
  fromAddress: string;
  toAddress: string;
  transactionHash: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  merchantId: string;
  invoiceNumber: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  amount: string;
  asset: string;
  status: InvoiceStatus;
  dueDate?: Date;
  paymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  statusCode?: number;
  response?: string;
  attemptNumber: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  merchantId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreatePaymentIntentRequest {
  amount: string;
  asset: string;
  recipient: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  amount: string;
  asset: string;
  dueDate?: string;
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  event: WebhookEvent;
  payment_id?: string;
  invoice_id?: string;
  transaction_hash?: string;
  amount?: string;
  asset?: string;
  timestamp: string;
}
