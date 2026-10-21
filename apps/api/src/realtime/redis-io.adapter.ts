/**
 * @file redis-io.adapter.ts
 * @description Custom Socket.IO adapter using Redis Pub/Sub for horizontal scaling.
 * Enables synchronized WebSocket messaging and presence across multiple API instances.
 */

import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

/**
 * Custom WebSocket adapter integrating @socket.io/redis-adapter.
 * Broadcasts events across all distributed application nodes via Redis pub/sub channels.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  protected readonly logger = new Logger(RedisIoAdapter.name);

  /**
   * Initializes Redis publisher and subscriber clients, attaching error handlers
   * and constructing the Socket.IO Redis adapter.
   */
  async connectToRedis(): Promise<void> {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(process.env.REDIS_PORT) || 6379;

    const pubClient = new Redis({
      host: redisHost,
      port: redisPort,
      lazyConnect: false,
    });

    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      this.logger.error(`Redis Pub Client Error: ${err.message}`);
    });

    subClient.on('error', (err) => {
      this.logger.error(`Redis Sub Client Error: ${err.message}`);
    });

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log(`Redis IO Adapter initialized on redis://${redisHost}:${redisPort}`);
  }

  /**
   * Overrides Socket.IO server creation to attach the Redis adapter
   * if Redis connection was successfully established.
   */
  override createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
