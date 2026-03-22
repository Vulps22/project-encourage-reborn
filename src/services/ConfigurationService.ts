import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { CoreConfig } from '../interface';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export class ConfigurationService {
  private cache: CoreConfig | null = null;
  private cacheExpiresAt: number = 0;

  constructor(private db: DatabaseService) {}

  async getConfig(): Promise<CoreConfig> {
    const now = Date.now();

    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    Logger.debug('ConfigurationService: cache miss, fetching from database');

    const config = await this.db.get<CoreConfig>('core', 'config', { id: 'config' });

    if (!config) {
      throw new Error('core.config row is missing — run db:install');
    }

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
