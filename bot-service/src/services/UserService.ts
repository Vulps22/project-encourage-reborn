import { Snowflake } from 'discord.js';
import { dsClient, DSError } from '../client';
import { User } from '@vulps22/project-encourage-types';
import { Logger } from '@vulps22/logger';

export class UserService {

  async getUser(userId: Snowflake): Promise<User | null> {
    Logger.debug(`Fetching user ${userId}`);
    try {
      const user = await dsClient.getUser(userId);
      Logger.debug(`User ${userId} retrieved successfully`);
      return user;
    } catch (error) {
      if (error instanceof DSError && error.status === 404) {
        Logger.debug(`User ${userId} not found`);
        return null;
      }
      throw error;
    }
  }

  async setUser(user: { id: Snowflake; username: string }): Promise<User> {
    Logger.debug(`Setting user data for ${user.id}`);
    const result = await dsClient.upsertUser(user.id, user.username);
    Logger.debug(`User ${user.id} upserted successfully`);
    return result;
  }

  async banUser(userId: Snowflake, reason: string, banMessageId?: Snowflake): Promise<void> {
    Logger.debug(`Banning user ${userId} with reason: ${reason}`);
    await dsClient.banUser(userId, reason, banMessageId);
    Logger.debug(`User ${userId} banned successfully`);
  }

  async unbanUser(userId: Snowflake): Promise<void> {
    Logger.debug(`Unbanning user ${userId}`);
    await dsClient.unbanUser(userId);
    Logger.debug(`User ${userId} unbanned successfully`);
  }

  /**
   * @param user Optional preloaded record, to avoid a redundant fetch when the
   *             caller already holds one.
   */
  async isUserBanned(userId: Snowflake, user?: User | null): Promise<string | false> {
    const record = user !== undefined ? user : await this.getUser(userId);
    return record && record.is_banned ? record.ban_reason || 'No reason provided' : false;
  }

}
