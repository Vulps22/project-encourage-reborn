import { dsClient } from '../client';
import { Logger } from '@vulps22/logger';
import { CoreConfig } from '@vulps22/project-encourage-types';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export class ConfigurationService {
  private cache: CoreConfig | null = null;
  private cacheExpiresAt: number = 0;

  async getConfig(): Promise<CoreConfig> {
    const now = Date.now();

    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    Logger.debug('ConfigurationService: cache miss, fetching from DS');

    const config = await dsClient.getConfig();

    this.cache = config;
    this.cacheExpiresAt = now + CACHE_TTL_MS;

    return config;
  }

  async getVoteThreshold(): Promise<number> {
    return (await this.getConfig()).vote_threshold;
  }

  /** Force the cache to expire on the next call — useful for testing. */
  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }
}
