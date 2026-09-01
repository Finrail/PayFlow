import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@payflow/database';
import { users, merchants } from '@payflow/database/schema';
import { eq } from 'drizzle-orm';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  businessName?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const { email, password, name, businessName } = request.body;

    // Validate input
    if (!email || !password || !name) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'email, password, and name are required',
      });
    }

    if (password.length < 8) {
      return reply.status(400).send({
        error: 'Invalid password',
        message: 'Password must be at least 8 characters',
      });
    }

    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return reply.status(409).send({
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
    });

    // Create merchant
    const merchantId = uuidv4();
    await db.insert(merchants).values({
      id: merchantId,
      userId,
      name,
      businessName,
    });

    // Generate JWT token
    const token = fastify.jwt.sign({ userId, merchantId });

    return reply.status(201).send({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        email,
        name,
        businessName,
      },
    });
  });

  // Login
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'email and password are required',
      });
    }

    const db = getDatabase();

    // Find user
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userResult.length === 0) {
      return reply.status(401).send({
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    const user = userResult[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return reply.status(401).send({
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Get merchant
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
    if (merchantResult.length === 0) {
      return reply.status(500).send({
        error: 'Merchant not found',
        message: 'Merchant account not found for user',
      });
    }

    const merchant = merchantResult[0];

    // Generate JWT token
    const token = fastify.jwt.sign({ userId: user.id, merchantId: merchant.id });

    return reply.send({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: merchant.name,
        businessName: merchant.businessName,
      },
    });
  });

  // Verify token
  fastify.get('/verify', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId, merchantId } = (request as any).user;

    const db = getDatabase();

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const merchantResult = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);

    if (userResult.length === 0 || merchantResult.length === 0) {
      return reply.status(404).send({
        error: 'User not found',
        message: 'User or merchant not found',
      });
    }

    const user = userResult[0];
    const merchant = merchantResult[0];

    return reply.send({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: merchant.name,
        businessName: merchant.businessName,
      },
    });
  });
}
