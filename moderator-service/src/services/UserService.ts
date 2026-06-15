import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { User } from '@vulps22/project-encourage-types';
import { Logger } from '../bot/utils';

export class UserService {
  constructor(private db: DatabaseClient) {}

  async getUser(userId: Snowflake): Promise<User | null> {
    Logger.debug(`Fetching user ${userId}`);
    const result = await this.db.getUser(userId);
    if (!result) {
      Logger.debug(`User ${userId} not found`);
      return null;
    }
    Logger.debug(`User ${userId} retrieved successfully`);
    return result;
  }

  async setUser(user: Partial<User> & { id: Snowflake }): Promise<User> {
    Logger.debug(`Setting user data for ${user.id}`);
    const result = await this.db.upsertUser(user.id, user.username ?? '');
    Logger.debug(`User ${user.id} upserted successfully`);
    return result;
  }

  async banUser(userId: Snowflake, reason: string, banMessageId?: Snowflake): Promise<void> {
    Logger.debug(`Banning user ${userId} with reason: ${reason}`);
    await this.db.banUser(userId, reason, banMessageId);
    Logger.debug(`User ${userId} banned successfully`);
  }

  async unbanUser(userId: Snowflake): Promise<void> {
    Logger.debug(`Unbanning user ${userId}`);
    await this.db.unbanUser(userId);
    Logger.debug(`User ${userId} unbanned successfully`);
  }

  async isUserBanned(userId: Snowflake): Promise<string | false> {
    const user = await this.getUser(userId);
    return user && user.is_banned ? user.ban_reason || 'No reason provided' : false;
  }

  async getUserServerCount(userId: Snowflake): Promise<number> {
    return this.db.getUserServerCount(userId);
  }

  async getUserBannedServerCount(userId: Snowflake): Promise<number> {
    return this.db.getUserBannedServerCount(userId);
  }
}
