import { Server, Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class ServerService {
  constructor(private db: DatabaseService) {}

  async getById(id: Snowflake): Promise<Server | null> {
    return await this.db.get<Server>('server', 'servers', { id });
  }

  async upsert(id: Snowflake, name: string | null, userId: Snowflake): Promise<Server> {
    const result = await this.db.upsert('server', 'servers', {
      id,
      name,
      user_id: userId,
    }, ['id']);

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to upsert server ${id}`);
    }

    return result.rows[0] as Server;
  }

  async update(id: Snowflake, data: Partial<Server>): Promise<Server | null> {
    const { id: _id, user_id: _userId, ...safeData } = data;
    const result = await this.db.update('server', 'servers', safeData as Record<string, unknown>, { id });
    return result.rows && result.rows.length > 0 ? result.rows[0] as Server : null;
  }

  async ban(id: Snowflake, moderatorId: Snowflake, banReason: string): Promise<Server | null> {
    const result = await this.db.update('server', 'servers', {
      is_banned: true,
      ban_reason: banReason,
      banned_by: moderatorId,
      datetime_banned: new Date(),
    }, { id });

    return result.rows && result.rows.length > 0 ? result.rows[0] as Server : null;
  }

  async unban(id: Snowflake): Promise<Server | null> {
    const result = await this.db.update('server', 'servers', {
      is_banned: false,
      ban_reason: null,
      banned_by: null,
      datetime_banned: null,
    }, { id });

    return result.rows && result.rows.length > 0 ? result.rows[0] as Server : null;
  }

  async delete(id: Snowflake): Promise<boolean> {
    const result = await this.db.delete('server', 'servers', { id });
    return result.affectedRows > 0;
  }

  async banByOwner(userId: Snowflake, reason: string): Promise<number> {
    const result = await this.db.update('server', 'servers', {
      is_banned: true,
      ban_reason: reason,
    }, {
      user_id: userId,
      is_banned: false,
    });
    return result.affectedRows;
  }

  async unbanByOwner(userId: Snowflake): Promise<number> {
    const result = await this.db.update('server', 'servers', {
      is_banned: false,
      ban_reason: null,
    }, {
      user_id: userId,
      is_banned: true,
    });
    return result.affectedRows;
  }

  async getUserCount(serverId: Snowflake): Promise<number> {
    return await this.db.count('server', 'server_users', { server_id: serverId });
  }

  async getBannedUserCount(serverId: Snowflake): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM "server"."server_users" su
       JOIN "user"."users" u ON su.user_id = u.id
       WHERE su.server_id = $1 AND u.is_banned = true`,
      [serverId]
    );
    return parseInt(result[0]?.count || '0');
  }

  async addUser(serverId: Snowflake, userId: Snowflake): Promise<void> {
    await this.db.execute(
      `INSERT INTO "server"."server_users" (server_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [serverId, userId]
    );
  }

  async removeUser(serverId: Snowflake, userId: Snowflake): Promise<boolean> {
    const result = await this.db.delete('server', 'server_users', { server_id: serverId, user_id: userId });
    return result.affectedRows > 0;
  }
}
