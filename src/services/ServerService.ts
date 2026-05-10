import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { dsClient, DSError } from '../client';
import { Logger } from '@vulps22/logger';
import { Server } from '@vulps22/project-encourage-types';
import { Config } from '../config';

export class ServerService {
  constructor(private db: DatabaseService) {}

  /**
   * Get or create a server record. Upserts when ownerId is provided,
   * otherwise fetches the existing record (throws if not found).
   */
  async getOrCreateServer(serverId: Snowflake, serverName?: string, ownerId?: Snowflake): Promise<Server> {
    Logger.debug(`Getting or creating server ${serverId}`);

    if (ownerId) {
      return await dsClient.post<Server>('/server', undefined, {
        id: serverId,
        name: serverName ?? null,
        user_id: ownerId,
      });
    }

    const existing = await this.getServerSettings(serverId);
    if (!existing) {
      throw new Error('Owner ID required to create new server');
    }
    return existing;
  }

  async getServerByID(serverId: Snowflake): Promise<Server | null> {
    return await this.getServerSettings(serverId);
  }

  async getServerSettings(serverId: Snowflake): Promise<Server | null> {
    try {
      return await dsClient.get<Server>('/server/:id', { id: serverId });
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async updateServerSettings(serverId: Snowflake, settings: Partial<Server>): Promise<void> {
    Logger.debug(`Updating server settings for ${serverId}`);
    const { id: _id, user_id: _userId, ...updateData } = settings;
    await dsClient.patch<Server>('/server/:id', { id: serverId }, updateData);
    Logger.debug(`Updated server settings for ${serverId}`);
  }

  async acceptTerms(serverId: Snowflake): Promise<void> {
    Logger.debug(`Server ${serverId} accepted terms`);
    await this.updateServerSettings(serverId, { has_accepted: true });
  }

  async acceptRules(serverId: Snowflake): Promise<void> {
    Logger.debug(`Server ${serverId} accepted rules`);
    await this.updateServerSettings(serverId, { can_create: true });
  }

  async setAnnouncementChannel(serverId: Snowflake, channelId: Snowflake): Promise<void> {
    Logger.debug(`Setting announcement channel for server ${serverId} to ${channelId}`);
    await this.updateServerSettings(serverId, { announcement_channel: channelId });
  }

  async markPlaytestNotified(serverId: Snowflake): Promise<void> {
    Logger.debug(`Marking playtest notice as shown for server ${serverId}`);
    await this.updateServerSettings(serverId, { playtest_notified: true });
  }

  async isServerBanned(serverId: Snowflake): Promise<string | false> {
    if (serverId == Config.OFFICIAL_GUILD_ID as Snowflake) return false;
    const server = await this.getServerSettings(serverId);
    return server && server.is_banned ? server.ban_reason || 'No reason provided' : false;
  }

  async canCreate(serverId: Snowflake): Promise<boolean> {
    const server = await this.getServerSettings(serverId);
    return !!(server && server.can_create && !server.is_banned);
  }

  // TODO: Needs DS endpoint — used by moderation handlers
  async banUserServers(userId: Snowflake, reason: string): Promise<number> {
    Logger.debug(`Banning all servers owned by user ${userId} with reason: ${reason}`);

    const result = await this.db.update('server', 'servers', {
      is_banned: true,
      ban_reason: reason
    }, {
      user_id: BigInt(userId),
      is_banned: false
    });

    Logger.debug(`Banned ${result.affectedRows} servers owned by user ${userId}`);
    return result.affectedRows;
  }

  async unbanUserServers(userId: Snowflake): Promise<number> {
    Logger.debug(`Unbanning all servers owned by user ${userId}`);

    const result = await this.db.update('server', 'servers', {
      is_banned: false,
      ban_reason: null
    }, {
      user_id: BigInt(userId),
      is_banned: true
    });

    Logger.debug(`Unbanned ${result.affectedRows} servers owned by user ${userId}`);
    return result.affectedRows;
  }

  // TODO: Needs DS endpoint — used by profile builders
  async getUserOwnedServerCount(userId: Snowflake): Promise<number> {
    return await this.db.count('server', 'servers', { user_id: BigInt(userId) });
  }

  async getServerUserCount(serverId: Snowflake): Promise<number> {
    return await this.db.count('server', 'server_users', { server_id: BigInt(serverId) });
  }

  async getServerBannedUserCount(serverId: Snowflake): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM "server"."server_users" su
       JOIN "user"."users" u ON su.user_id = u.id
       WHERE su.server_id = $1 AND u.is_banned = true`,
      [BigInt(serverId)]
    );
    return parseInt(result[0]?.count || '0');
  }
}
