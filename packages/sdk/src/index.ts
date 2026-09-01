import type {
  CreatePaymentIntentRequest,
  CreateInvoiceRequest,
  PaymentIntent,
  Invoice,
  WebhookPayload,
} from '@payflow/types';

export interface PayFlowConfig {
  apiKey: string;
  apiUrl?: string;
  timeout?: number;
}

export class PayFlow {
  private apiKey: string;
  private apiUrl: string;
  private timeout: number;

  constructor(config: PayFlowConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'http://localhost:3001/api/v1';
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Payment Intents
  async paymentIntents = {
    create: async (data: CreatePaymentIntentRequest): Promise<PaymentIntent> => {
      return this.request<PaymentIntent>('/payment-intents', {
        method: 'POST',
        headers: {
          'Idempotency-Key': data.idempotencyKey || crypto.randomUUID(),
        },
        body: JSON.stringify(data),
      });
    },

    get: async (id: string): Promise<PaymentIntent> => {
      return this.request<PaymentIntent>(`/payment-intents/${id}`);
    },

    list: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<PaymentIntent[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<PaymentIntent[]>(`/payment-intents?${query}`);
    },
  };

  // Invoices
  async invoices = {
    create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
      return this.request<Invoice>('/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (id: string): Promise<Invoice> => {
      return this.request<Invoice>(`/invoices/${id}`);
    },

    list: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<Invoice[]> => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<Invoice[]>(`/invoices?${query}`);
    },

    update: async (id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> => {
      return this.request<Invoice>(`/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    send: async (id: string): Promise<Invoice> => {
      return this.request<Invoice>(`/invoices/${id}/send`, {
        method: 'POST',
      });
    },

    cancel: async (id: string): Promise<Invoice> => {
      return this.request<Invoice>(`/invoices/${id}/cancel`, {
        method: 'POST',
      });
    },
  };

  // Webhooks (for verification)
  verifyWebhookSignature = (
    payload: WebhookPayload,
    signature: string,
    secret: string
  ): boolean => {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  };
}

export default PayFlow;
