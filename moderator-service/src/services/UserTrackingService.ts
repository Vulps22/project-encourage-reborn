import { Interaction, Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Logger } from '../bot/utils';
import { DMInteractionError } from '../bot/errors';
import { TrackingCacheEntry } from '../bot/interface';

/**
 * UserTrackingService - Tracks user and server interactions
 *
 * Ensures users, servers, and user-server relationships are recorded
 * in the database on every bot interaction.
 *
 * Uses in-memory cache with 1-hour TTL to prevent repeated DS calls
 * for the same user-server combination.
 */
export class UserTrackingService {
  private db: DatabaseClient;
  private cache: Map<string, TrackingCacheEntry>;
  private cleanupTimer?: NodeJS.Timeout;
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor(db: DatabaseClient) {
    this.db = db;
    this.cache = new Map();

    // Clean up expired cache entries every 10 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);

    // Allow process to exit if this is the only active handle
    if (this.cleanupTimer && typeof (this.cleanupTimer).unref === 'function') {
      (this.cleanupTimer).unref();
    }
  }

  /**
   * Stop the internal cleanup timer. Useful for explicit teardown in tests.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Generate cache key for user-server combination
   */
  private getCacheKey(userId: Snowflake, serverId: Snowflake): string {
    return `${userId}:${serverId}`;
  }

  /**
   * Check if tracking data is cached and still valid
   */
  private isCached(userId: Snowflake, serverId: Snowflake): boolean {
    const key = this.getCacheKey(userId, serverId);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Add tracking data to cache
   */
  private addToCache(userId: Snowflake, serverId: Snowflake): void {
    const key = this.getCacheKey(userId, serverId);
    this.cache.set(key, { timestamp: Date.now() });
  }

  /**
   * Track a user interaction with the bot
   *
   * @param interaction Discord interaction object
   * @throws DMInteractionError if interaction is in DMs
   * @throws Error if DS call fails
   */
  async trackInteraction(interaction: Interaction): Promise<void> {
    const userId = interaction.user.id;
    const serverId = interaction.guildId;

    // Reject DM interactions
    if (!serverId || !interaction.guild) {
      Logger.debug(`DM interaction attempted by user ${userId}`);
      throw new DMInteractionError();
    }

    // Check cache first
    if (this.isCached(userId, serverId)) {
      Logger.debug(`Tracking data cached for user ${userId} in server ${serverId}`);
      return;
    }

    Logger.debug(`Tracking interaction: user ${userId} in server ${serverId}`);

    try {
      const serverOwner = interaction.guild.ownerId;
      await this.db.trackInteraction(userId, serverId, serverOwner);
      this.addToCache(userId, serverId);
      Logger.debug(`Successfully tracked interaction: user ${userId} in server ${serverId}`);
    } catch (error) {
      const errorMessage = `Failed to track interaction for user ${userId} in server ${serverId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      Logger.error(errorMessage);
      throw new Error(`Database tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
