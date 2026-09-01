import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import env from '@fastify/env';
import pino from 'pino';
import authPlugin from './plugins/auth.plugin';
import { authRoutes } from './routes/auth.routes';
import { paymentIntentsRoutes } from './routes/payment-intents.routes';
import { invoiceRoutes } from './routes/invoices.routes';
import { paymentMonitor } from './services/payment-monitor.service';
import { processPendingWebhooks } from './services/webhook.service';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

const schema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: {
      type: 'string',
      default: '3001',
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    DATABASE_URL: {
      type: 'string',
    },
    JWT_SECRET: {
      type: 'string',
    },
    STELLAR_NETWORK_PASSPHRASE: {
      type: 'string',
      default: 'Test SDF Network ; September 2015',
    },
    STELLAR_RPC_URL: {
      type: 'string',
      default: 'https://soroban-testnet.stellar.org',
    },
    STELLAR_HORIZON_URL: {
      type: 'string',
      default: 'https://horizon-testnet.stellar.org',
    },
    STELLAR_USDC_ISSUER: {
      type: 'string',
      default: 'GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE',
    },
    STELLAR_USDC_CODE: {
      type: 'string',
      default: 'USDC',
    },
    CONTRACT_ADDRESS: {
      type: 'string',
      default: '',
    },
    WEBHOOK_SECRET: {
      type: 'string',
    },
    WEBHOOK_TIMEOUT_MS: {
      type: 'string',
      default: '5000',
    },
    WEBHOOK_MAX_RETRIES: {
      type: 'string',
      default: '5',
    },
    RATE_LIMIT_TTL: {
      type: 'string',
      default: '60',
    },
    RATE_LIMIT_MAX: {
      type: 'string',
      default: '100',
    },
  },
};

const options = {
  conf: {
    env: true,
    dotenv: true,
  },
  schema,
};

async function start() {
  try {
    await fastify.register(env, options);

    await fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    await fastify.register(jwt, {
      secret: fastify.config.JWT_SECRET,
    });

    await fastify.register(rateLimit, {
      max: parseInt(fastify.config.RATE_LIMIT_MAX),
      timeWindow: parseInt(fastify.config.RATE_LIMIT_TTL) * 1000,
    });

    await fastify.register(authPlugin);

    // Start background services
    if (process.env.NODE_ENV !== 'test') {
      paymentMonitor.start();
      
      // Process webhooks every 30 seconds
      setInterval(async () => {
        await processPendingWebhooks();
      }, 30000);
    }

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      fastify.log.info(`${signal} received, shutting down gracefully`);
      paymentMonitor.stop();
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Health check endpoints
    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }));

    fastify.get('/ready', async () => ({
      status: 'ready',
      timestamp: new Date().toISOString(),
    }));

    // API routes
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
    await fastify.register(paymentIntentsRoutes, { prefix: '/api/v1/payment-intents' });
    await fastify.register(invoiceRoutes, { prefix: '/api/v1/invoices' });

    const port = parseInt(fastify.config.PORT);
    const host = fastify.config.HOST;

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
