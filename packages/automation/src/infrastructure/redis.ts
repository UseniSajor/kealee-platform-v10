import Redis, { type RedisOptions } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const DEFAULT_OPTIONS: Partial<RedisOptions> = {
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy(times: number) {
    const delay = Math.min(times * 500, 5000);
    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
};

let queueConnection: Redis | null = null;
let pubConnection: Redis | null = null;
let subConnection: Redis | null = null;

function createConnection(name: string): Redis {
  const connection = new Redis(REDIS_URL, {
    ...DEFAULT_OPTIONS,
    connectionName: `kealee-${name}`,
  });

  connection.on('error', (err) => {
    console.error(`[Redis:${name}] Connection error:`, err.message);
  });

  connection.on('connect', () => {
    console.log(`[Redis:${name}] Connected`);
  });

  connection.on('close', () => {
    console.log(`[Redis:${name}] Connection closed`);
  });

  return connection;
}

/** Get the shared queue connection (used by BullMQ queues and workers). */
export function getQueueConnection(): Redis {
  if (!queueConnection) {
    queueConnection = createConnection('queue');
  }
  return queueConnection;
}

/** Get a dedicated publish connection. */
export function getPubConnection(): Redis {
  if (!pubConnection) {
    pubConnection = createConnection('pub');
  }
  return pubConnection;
}

/** Get a dedicated subscribe connection. */
export function getSubConnection(): Redis {
  if (!subConnection) {
    subConnection = createConnection('sub');
  }
  return subConnection;
}

/** Health check: ping Redis and return true if healthy. */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const conn = getQueueConnection();
    const result = await conn.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

/** Gracefully close all Redis connections. */
export async function closeAllConnections(): Promise<void> {
  const connections = [queueConnection, pubConnection, subConnection];
  await Promise.all(
    connections
      .filter((c): c is Redis => c !== null)
      .map((c) => c.quit().catch(() => c.disconnect())),
  );
  queueConnection = null;
  pubConnection = null;
  subConnection = null;
}
