import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Logger } from '../bot/utils';
import { Server } from '@vulps22/project-encourage-types';
import { Config } from '../bot/config';

export class ServerService {
  constructor(private db: DatabaseClient) {}

  async banUserServers(userId: Snowflake, reason: string): Promise<number> {
    Logger.debug(`Banning all servers owned by user ${userId} with reason: ${reason}`);
    const count = await this.db.banUserServers(userId, reason);
    Logger.debug(`Banned ${count} servers owned by user ${userId}`);
    return count;
  }

  async unbanUserServers(userId: Snowflake): Promise<number> {
    Logger.debug(`Unbanning all servers owned by user ${userId}`);
    const count = await this.db.unbanUserServers(userId);
    Logger.debug(`Unbanned ${count} servers owned by user ${userId}`);
    return count;
  }

  async getUserOwnedServerCount(userId: Snowflake): Promise<number> {
    return this.db.getUserOwnedServerCount(userId);
  }

  async getServerUserCount(serverId: Snowflake): Promise<number> {
    return this.db.getServerUserCount(serverId);
  }

  async getServerBannedUserCount(serverId: Snowflake): Promise<number> {
    return this.db.getServerBannedUserCount(serverId);
  }

  async getOrCreateServer(serverId: Snowflake, serverName?: string, ownerId?: Snowflake): Promise<Server> {
    Logger.debug(`Getting or creating server ${serverId}`);
    if (!ownerId) throw new Error('Owner ID required to create new server');
    const server = await this.db.upsertServer(serverId, serverName ?? null, ownerId);
    Logger.debug(`Server ${serverId} retrieved/created`);
    return server;
  }

  async getServerByID(serverId: Snowflake): Promise<Server | null> {
    return this.getServerSettings(serverId);
  }

  async getServerSettings(serverId: Snowflake): Promise<Server | null> {
    return this.db.getServer(serverId);
  }

  async updateServerSettings(serverId: Snowflake, settings: Partial<Server>): Promise<void> {
    Logger.debug(`Updating server settings for ${serverId}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: id, user_id: userId, ...rest } = settings;
    if (Object.keys(rest).length > 0) {
      await this.db.updateServer(serverId, rest);
    }
    Logger.debug(`Updated server settings for ${serverId}`);
  }

  async acceptTerms(serverId: Snowflake): Promise<void> {
    await this.updateServerSettings(serverId, { has_accepted: true });
  }

  async acceptRules(serverId: Snowflake): Promise<void> {
    await this.updateServerSettings(serverId, { can_create: true });
  }

  async setAnnouncementChannel(serverId: Snowflake, channelId: Snowflake): Promise<void> {
    Logger.debug(`Setting announcement channel for server ${serverId} to ${channelId}`);
    await this.updateServerSettings(serverId, { announcement_channel: channelId });
  }

  async markPlaytestNotified(serverId: Snowflake): Promise<void> {
    await this.updateServerSettings(serverId, { playtest_notified: true });
  }

  async isServerBanned(serverId: Snowflake): Promise<string | false> {
    if (serverId === Config.OFFICIAL_GUILD_ID as Snowflake) return false;
    const server = await this.getServerSettings(serverId);
    return server && server.is_banned ? server.ban_reason || 'No reason provided' : false;
  }

  async canCreate(serverId: Snowflake): Promise<boolean> {
    const server = await this.getServerSettings(serverId);
    return !!(server && server.can_create && !server.is_banned);
  }
}
