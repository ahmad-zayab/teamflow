import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private memoryCache = new Map<string, { value: any; expiry: number }>();
  private logger = new Logger(CacheService.name);

  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds = 60): Promise<void> {
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async invalidate(pattern: string): Promise<void> {
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}
