import { Snowflake } from 'discord.js';
import { dsClient, DSError } from '../client';
import { User } from '@vulps22/project-encourage-types';
import { Logger } from '@vulps22/logger';

export class UserService {

  async getUser(userId: Snowflake): Promise<User | null> {
    Logger.debug(`Fetching user ${userId}`);
    try {
      const user = await dsClient.get<User>('/user/:id', { id: userId });
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
    const result = await dsClient.post<User>('/user', undefined, {
      id: user.id,
      username: user.username,
    });
    Logger.debug(`User ${user.id} upserted successfully`);
    return result;
  }

  async banUser(userId: Snowflake, reason: string, banMessageId?: Snowflake): Promise<void> {
    Logger.debug(`Banning user ${userId} with reason: ${reason}`);
    await dsClient.patch<User>('/user/:id/ban', { id: userId }, {
      ban_reason: reason,
      ...(banMessageId ? { ban_message_id: banMessageId } : {}),
    });
    Logger.debug(`User ${userId} banned successfully`);
  }

  async unbanUser(userId: Snowflake): Promise<void> {
    Logger.debug(`Unbanning user ${userId}`);
    await dsClient.patch<User>('/user/:id/unban', { id: userId });
    Logger.debug(`User ${userId} unbanned successfully`);
  }

  async isUserBanned(userId: Snowflake): Promise<string | false> {
    const user = await this.getUser(userId);
    return user && user.is_banned ? user.ban_reason || 'No reason provided' : false;
  }

}
