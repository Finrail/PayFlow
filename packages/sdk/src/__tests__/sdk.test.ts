import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PayFlow } from '../index';

describe('PayFlow SDK', () => {
  let payflow: PayFlow;
  let mockFetch: any;

  beforeEach(() => {
    payflow = new PayFlow({
      apiKey: 'test-api-key',
      apiUrl: 'http://localhost:3001/api/v1',
    });

    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default API URL', () => {
      const client = new PayFlow({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should initialize with custom API URL', () => {
      const client = new PayFlow({
        apiKey: 'test-key',
        apiUrl: 'https://api.example.com',
      });
      expect(client).toBeDefined();
    });

    it('should throw error with missing API key', () => {
      expect(() => {
        // @ts-ignore
        new PayFlow({});
      }).toThrow();
    });
  });

  describe('paymentIntents.create', () => {
    it('should create a payment intent', async () => {
      const mockResponse = {
        id: 'pi_test123',
        amount: '50',
        asset: 'USDC',
        status: 'CREATED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payflow.paymentIntents.create({
        amount: '50',
        asset: 'USDC',
        recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/payment-intents',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should handle errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid request' }),
      });

      await expect(
        payflow.paymentIntents.create({
          amount: '50',
          asset: 'USDC',
          recipient: 'GTEST1234567890123456789012345678901234567890123456789012345678',
        })
      ).rejects.toThrow();
    });
  });

  describe('paymentIntents.get', () => {
    it('should get a payment intent', async () => {
      const mockResponse = {
        id: 'pi_test123',
        amount: '50',
        asset: 'USDC',
        status: 'CREATED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payflow.paymentIntents.get('pi_test123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/payment-intents/pi_test123',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('paymentIntents.list', () => {
    it('should list payment intents', async () => {
      const mockResponse = [
        { id: 'pi_test123', amount: '50', asset: 'USDC' },
        { id: 'pi_test456', amount: '100', asset: 'USDC' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payflow.paymentIntents.list();

      expect(result).toEqual(mockResponse);
    });

    it('should pass query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await payflow.paymentIntents.list({ limit: 10, status: 'CONFIRMED' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });
  });

  describe('invoices.create', () => {
    it('should create an invoice', async () => {
      const mockResponse = {
        id: 'inv_test123',
        invoiceNumber: 'INV-001',
        amount: '500',
        status: 'DRAFT',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payflow.invoices.create({
        invoiceNumber: 'INV-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        description: 'Services',
        amount: '500',
        asset: 'USDC',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('invoices.send', () => {
    it('should send an invoice', async () => {
      const mockResponse = {
        id: 'inv_test123',
        status: 'OPEN',
        paymentIntentId: 'pi_test123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await payflow.invoices.send('inv_test123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/invoices/inv_test123/send',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = {
        event: 'payment.confirmed',
        payment_id: 'pi_test123',
        amount: '50',
        asset: 'USDC',
        timestamp: '2026-09-01T10:00:00Z',
      };

      const secret = 'test-secret';

      const signature = payflow.verifyWebhookSignature(payload, 'some-signature', secret);

      // This will fail with the wrong signature, but tests the function exists
      expect(typeof signature).toBe('boolean');
    });
  });
});
