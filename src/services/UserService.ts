import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { User } from '../interface';
import { Logger } from '../utils';

/**
 * UserService - Handles user data operations
 * 
 * Business logic for user management including:
 * - Retrieving user information
 * - Updating user data
 * - User statistics
 */
export class UserService {
  constructor(private db: DatabaseService) {}

  /**
   * Get user by ID
   * @param userId Discord user ID
   * @returns User object or null if not found
   */
  async getUser(userId: Snowflake): Promise<User | null> {
    Logger.debug(`Fetching user ${userId}`);
    
    const result = await this.db.get<User>('user', 'users', { id: BigInt(userId) });
    
    if (!result) {
      Logger.debug(`User ${userId} not found`);
      return null;
    }

    Logger.debug(`User ${userId} retrieved successfully`);
    return result;
  }

  /**
   * Create or update user data
   * @param user User object with updated data
   * @returns Updated user object
   */
  async setUser(user: Partial<User> & { id: Snowflake }): Promise<User> {
    Logger.debug(`Setting user data for ${user.id}`);

    // Check if user exists
    const existingUser = await this.getUser(user.id);

    // Convert Snowflake IDs to BigInt for database
    const userData: any = { ...user };
    userData.id = BigInt(user.id);
    if (user.ban_message_id) {
      userData.ban_message_id = BigInt(user.ban_message_id);
    }

    let result;
    if (existingUser) {
      // Update existing user
      const { id, ...updateData } = userData;
      await this.db.update('user', 'users', updateData, { id });
      Logger.debug(`User ${user.id} updated successfully`);
      
      // Fetch and return updated user
      result = await this.getUser(user.id);
    } else {
      // Insert new user
      const insertResult = await this.db.insert('user', 'users', userData);
      Logger.debug(`User ${user.id} created successfully`);
      
      if (!insertResult.rows || insertResult.rows.length === 0) {
        throw new Error('Failed to create user');
      }
      
      result = insertResult.rows[0] as User;
    }

    if (!result) {
      throw new Error(`Failed to retrieve user ${user.id} after update`);
    }

    return result;
  }

  /**
   * Ban a user from using the bot
   * @param userId Discord user ID
   * @param reason Ban reason
   * @param banMessageId Optional message ID for ban notification
   */
  async banUser(userId: Snowflake, reason: string, banMessageId?: Snowflake): Promise<void> {
    Logger.debug(`Banning user ${userId} with reason: ${reason}`);

    const updateData: any = {
      is_banned: true,
      ban_reason: reason
    };

    if (banMessageId) {
      updateData.ban_message_id = BigInt(banMessageId);
    }

    await this.db.update('user', 'users', updateData, { id: BigInt(userId) });
    
    Logger.debug(`User ${userId} banned successfully`);
  }

  /**
   * Unban a user
   * @param userId Discord user ID
   */
  async unbanUser(userId: Snowflake): Promise<void> {
    Logger.debug(`Unbanning user ${userId}`);

    await this.db.update('user', 'users', {
      is_banned: false,
      ban_reason: null,
      ban_message_id: null
    }, { id: BigInt(userId) });
    
    Logger.debug(`User ${userId} unbanned successfully`);
  }

  async getUserServerCount(userId: Snowflake): Promise<number> {
    return await this.db.count('server', 'server_users', { user_id: BigInt(userId) });
  }

  async getUserBannedServerCount(userId: Snowflake): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM "server"."servers" WHERE "user_id" = $1 AND "is_banned" = true`,
      [BigInt(userId)]
    );
    return parseInt(result[0]?.count || '0');
  }
}
