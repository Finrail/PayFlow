import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, users, merchants } from '@payflow/database';
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
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string'
      || !email.trim() || !password || !name.trim()) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'email, password, and name are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return reply.status(400).send({
        error: 'Invalid email',
        message: 'Enter a valid email address',
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
    const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
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
      email: normalizedEmail,
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
        email: normalizedEmail,
        name,
        businessName,
      },
    });
  });

  // Login
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const db = getDatabase();

    // Find user
    const userResult = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
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
  const getCurrentUser = async (request: any, reply: any) => {
    try {
      await (fastify as any).authenticate(request, reply);
    } catch (err) {
      return reply.send(err);
    }

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

    return reply.send({
      userId,
      merchantId,
      email: userResult[0].email,
      name: merchantResult[0].name,
    });
  };

  fastify.get('/verify', getCurrentUser);
  fastify.get('/me', getCurrentUser);
}
