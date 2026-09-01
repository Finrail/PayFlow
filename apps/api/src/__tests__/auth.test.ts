import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';
import { getDatabase } from '@payflow/database';
import { merchants, users } from '@payflow/database/schema';
import { eq } from 'drizzle-orm';

describe('Authentication Routes', () => {
  let app: any;
  let db: any;

  beforeAll(async () => {
    app = await build();
    db = getDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new merchant', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          businessName: 'Test Business',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json).toHaveProperty('id');
      expect(response.json).toHaveProperty('email', 'test@example.com');
      expect(response.json).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'SecurePassword123!',
          name: 'Test User',
          businessName: 'Test Business',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test2@example.com',
          password: 'weak',
          name: 'Test User',
          businessName: 'Test Business',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with duplicate email', async () => {
      const payload = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        businessName: 'Test Business',
      };

      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'login-test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          businessName: 'Test Business',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login-test@example.com',
          password: 'SecurePassword123!',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('token');
      expect(response.json).toHaveProperty('merchant');
    });

    it('should fail with invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login-test@example.com',
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'me-test@example.com',
          password: 'SecurePassword123!',
          name: 'Test User',
          businessName: 'Test Business',
        },
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'me-test@example.com',
          password: 'SecurePassword123!',
        },
      });

      token = loginResponse.json().token;
    });

    it('should get current user with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json).toHaveProperty('email', 'me-test@example.com');
    });

    it('should fail without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
