import { User, Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class UserService {
  constructor(private db: DatabaseService) {}

  async getById(id: Snowflake): Promise<User | null> {
    return await this.db.get<User>('user', 'users', { id });
  }

  async upsert(user: Partial<User> & { id: Snowflake }): Promise<User> {
    const result = await this.db.upsert('user', 'users', user, ['id']);

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to upsert user ${user.id}`);
    }

    return result.rows[0] as User;
  }

  async ban(id: Snowflake, banReason: string, banMessageId?: Snowflake): Promise<User | null> {
    const data: Record<string, unknown> = { is_banned: true, ban_reason: banReason };
    if (banMessageId) data.ban_message_id = banMessageId;

    const result = await this.db.update('user', 'users', data, { id });
    return result.rows && result.rows.length > 0 ? result.rows[0] as User : null;
  }

  async update(id: Snowflake, data: Partial<User>): Promise<User | null> {
    const { id: _id, ...safeData } = data;
    const result = await this.db.update('user', 'users', safeData as Record<string, unknown>, { id });
    return result.rows && result.rows.length > 0 ? result.rows[0] as User : null;
  }

  async unban(id: Snowflake): Promise<User | null> {
    const result = await this.db.update('user', 'users', {
      is_banned: false,
      ban_reason: null,
      ban_message_id: null,
    }, { id });

    return result.rows && result.rows.length > 0 ? result.rows[0] as User : null;
  }

  async getServerCount(id: Snowflake): Promise<number> {
    return await this.db.count('server', 'server_users', { user_id: id });
  }

  async getOwnedServerCount(id: Snowflake): Promise<number> {
    return await this.db.count('server', 'servers', { user_id: id });
  }

  async getBannedServerCount(id: Snowflake): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM "server"."servers" WHERE "user_id" = $1 AND "is_banned" = true`,
      [id]
    );
    return parseInt(result[0]?.count || '0');
  }
}
