import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';
import { getDatabase } from '@payflow/database';
import { paymentIntents, merchants } from '@payflow/database/schema';
import { eq } from 'drizzle-orm';

describe('Payment Intents Routes', () => {
  let app: any;
  let db: any;
  let token: string;
  let merchantId: string;

  beforeAll(async () => {
    app = await build();
    db = getDatabase();

    // Register and login
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'payment-test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        businessName: 'Test Business',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'payment-test@example.com',
        password: 'SecurePassword123!',
      },
    });

    token = loginResponse.json().token;
    merchantId = loginResponse.json().merchant.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/payment-intents', () => {
    it('should create a payment intent', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
          'Idempotency-Key': 'test-payment-001',
        },
        payload: {
          amount: '50',
          asset: 'USDC',
          recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
          metadata: {
            order_id: '12345',
          },
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json).toHaveProperty('id');
      expect(response.json).toHaveProperty('amount', '50');
      expect(response.json).toHaveProperty('asset', 'USDC');
      expect(response.json).toHaveProperty('status', 'CREATED');
    });

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        payload: {
          amount: '50',
          asset: 'USDC',
          recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with invalid amount', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          amount: '-50',
          asset: 'USDC',
          recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with invalid Stellar address', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          amount: '50',
          asset: 'USDC',
          recipient: 'invalid-address',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle idempotency', async () => {
      const payload = {
        amount: '50',
        asset: 'USDC',
        recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
      };

      const response1 = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
          'Idempotency-Key': 'test-idempotency-001',
        },
        payload,
      });

      const response2 = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
          'Idempotency-Key': 'test-idempotency-001',
        },
        payload,
      });

      expect(response1.json.id).toBe(response2.json.id);
    });
  });

  describe('GET /api/v1/payment-intents/:id', () => {
    let paymentIntentId: string;

    beforeAll(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
          'Idempotency-Key': 'test-get-payment-001',
        },
        payload: {
          amount: '50',
          asset: 'USDC',
          recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
        },
      });

      paymentIntentId = response.json.id;
    });

    it('should get a payment intent by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/payment-intents/${paymentIntentId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('id', paymentIntentId);
    });

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/payment-intents/${paymentIntentId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail for non-existent payment intent', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/payment-intents/non-existent-id',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/payment-intents', () => {
    beforeAll(async () => {
      // Create multiple payment intents
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/v1/payment-intents',
          headers: {
            authorization: `Bearer ${token}`,
            'Idempotency-Key': `test-list-payment-${i}`,
          },
          payload: {
            amount: (50 + i).toString(),
            asset: 'USDC',
            recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
          },
        });
      }
    });

    it('should list payment intents', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/payment-intents',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.json)).toBe(true);
      expect(response.json.length).toBeGreaterThanOrEqual(5);
    });

    it('should respect limit parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/payment-intents?limit=3',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json.length).toBeLessThanOrEqual(3);
    });

    it('should respect offset parameter', async () => {
      const response1 = await app.inject({
        method: 'GET',
        url: '/api/v1/payment-intents?limit=2',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/api/v1/payment-intents?limit=2&offset=2',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response1.json[0].id).not.toBe(response2.json[0].id);
    });

    it('should filter by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/payment-intents?status=CREATED',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      response.json.forEach((intent: any) => {
        expect(intent.status).toBe('CREATED');
      });
    });
  });
});
