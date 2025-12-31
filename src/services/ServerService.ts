import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';

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
}
