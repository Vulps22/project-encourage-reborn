import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { Server } from '../interface';

/**
 * ServerService - Handles server data operations
 * 
 * Business logic for server management including:
 * - Server banning/unbanning
 * - Server statistics
 */
export class ServerService {
  constructor(private db: DatabaseService) {}

  /**
   * Ban all servers owned by a specific user
   * @param userId Discord user ID of the server owner
   * @param reason Reason for banning
   * @returns Number of servers banned
   */
  async banUserServers(userId: Snowflake, reason: string): Promise<number> {
    Logger.debug(`Banning all servers owned by user ${userId} with reason: ${reason}`);

    const result = await this.db.update('server', 'servers', {
      is_banned: true,
      ban_reason: reason
    }, {
      owner: BigInt(userId),
      is_banned: false // Only ban servers that aren't already banned
    });

    Logger.debug(`Banned ${result.affectedRows} servers owned by user ${userId}`);
    return result.affectedRows;
  }

  /**
   * Unban all servers owned by a specific user
   * @param userId Discord user ID of the server owner
   * @returns Number of servers unbanned
   */
  async unbanUserServers(userId: Snowflake): Promise<number> {
    Logger.debug(`Unbanning all servers owned by user ${userId}`);

    const result = await this.db.update('server', 'servers', {
      is_banned: false,
      ban_reason: null
    }, {
      owner: BigInt(userId),
      is_banned: true // Only unban servers that are currently banned
    });

    Logger.debug(`Unbanned ${result.affectedRows} servers owned by user ${userId}`);
    return result.affectedRows;
  }

  /**
   * Get count of servers owned by a user
   * @param userId Discord user ID
   * @returns Number of servers owned
   */
  async getUserOwnedServerCount(userId: Snowflake): Promise<number> {
    return await this.db.count('server', 'servers', { owner: BigInt(userId) });
  }

  /**
   * Get or create a server record
   * @param serverId Discord server ID
   * @param serverName Server name (optional, for creation)
   * @param ownerId Owner ID (optional, for creation)
   * @returns Server record
   */
  async getOrCreateServer(serverId: Snowflake, serverName?: string, ownerId?: Snowflake): Promise<Server> {
    Logger.debug(`Getting or creating server ${serverId}`);

    // Try to get existing server
    const existing = await this.getServerSettings(serverId);
    if (existing) {
      return existing;
    }

    // Create new server record
    if (!ownerId) {
      throw new Error('Owner ID required to create new server');
    }

    await this.db.insert('server', 'servers', {
      id: BigInt(serverId),
      name: serverName || null,
      owner: BigInt(ownerId),
      has_accepted: false,
      can_create: false,
      is_banned: false,
      ban_reason: null,
      dare_success_xp: 50,
      dare_fail_xp: 25,
      truth_success_xp: 40,
      truth_fail_xp: 40,
      message_xp: 0,
      level_up_channel: null,
      announcement_channel: null,
      is_entitled: false,
      entitlement_end_date: null,
      message_id: null,
      is_deleted: false,
      datetime_deleted: null
    });

    Logger.debug(`Created new server record for ${serverId}`);

    const newServer = await this.getServerSettings(serverId);
    if (!newServer) {
      throw new Error('Failed to create server record');
    }

    return newServer;
  }

  /**
   * Get server settings
   * @param serverId Discord server ID
   * @returns Server settings or null if not found
   */
  async getServerSettings(serverId: Snowflake): Promise<Server | null> {
    const row = await this.db.get('server', 'servers', { id: BigInt(serverId) });

    if (!row) {
      return null;
    }
    return {
      id: String(row.id),
      name: row.name,
      owner: String(row.owner),
      has_accepted: row.has_accepted,
      can_create: row.can_create,
      is_banned: row.is_banned,
      ban_reason: row.ban_reason,
      date_created: new Date(row.date_created),
      date_updated: new Date(row.date_updated),
      dare_success_xp: row.dare_success_xp,
      dare_fail_xp: row.dare_fail_xp,
      truth_success_xp: row.truth_success_xp,
      truth_fail_xp: row.truth_fail_xp,
      message_xp: row.message_xp,
      level_up_channel: row.level_up_channel ? String(row.level_up_channel) : null,
      announcement_channel: row.announcement_channel ? String(row.announcement_channel) : null,
      is_entitled: row.is_entitled,
      entitlement_end_date: row.entitlement_end_date ? new Date(row.entitlement_end_date) : null,
      message_id: row.message_id ? String(row.message_id) : null,
      is_deleted: row.is_deleted,
      datetime_deleted: row.datetime_deleted ? new Date(row.datetime_deleted) : null
    };
  }

  /**
   * Update server settings
   * @param serverId Discord server ID
   * @param settings Partial server settings to update
   */
  async updateServerSettings(serverId: Snowflake, settings: Partial<Server>): Promise<void> {
    Logger.debug(`Updating server settings for ${serverId}`);

    // Convert Snowflake strings to BigInt for database
    const dbSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(settings)) {
      if (key === 'id' || key === 'owner') {
        continue; // Don't allow updating ID or owner
      }

      if (key === 'level_up_channel' || key === 'announcement_channel' || key === 'message_id') {
        dbSettings[key] = value ? BigInt(value as string) : null;
      } else {
        dbSettings[key] = value;
      }
    }

    await this.db.update('server', 'servers', dbSettings, { id: BigInt(serverId) });
    Logger.debug(`Updated server settings for ${serverId}`);
  }

  /**
   * Mark server as having accepted terms
   * @param serverId Discord server ID
   */
  async acceptTerms(serverId: Snowflake): Promise<void> {
    Logger.debug(`Server ${serverId} accepted terms`);
    await this.updateServerSettings(serverId, { has_accepted: true });
  }

  /**
   * Mark server as having accepted rules (grants can_create permission)
   * @param serverId Discord server ID
   */
  async acceptRules(serverId: Snowflake): Promise<void> {
    Logger.debug(`Server ${serverId} accepted rules`);
    await this.updateServerSettings(serverId, { can_create: true });
  }

  /**
   * Set announcement channel for server
   * @param serverId Discord server ID
   * @param channelId Channel ID
   */
  async setAnnouncementChannel(serverId: Snowflake, channelId: Snowflake): Promise<void> {
    Logger.debug(`Setting announcement channel for server ${serverId} to ${channelId}`);
    await this.updateServerSettings(serverId, { announcement_channel: channelId });
  }
}
