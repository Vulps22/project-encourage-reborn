import { Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class TrackService {
  constructor(private db: DatabaseService) {}

  /**
   * Ensure a user, server, and their relationship all exist.
   * Runs as a single transaction — safe to call on every interaction.
   */
  async track(userId: Snowflake, serverId: Snowflake, serverOwnerId: Snowflake): Promise<void> {
    await this.db.transaction(async (txDb) => {
      await txDb.upsert('user', 'users', { id: userId }, ['id']);
      await txDb.upsert('server', 'servers', { id: serverId, user_id: serverOwnerId }, ['id']);
      await txDb.upsert('server', 'server_users', { user_id: userId, server_id: serverId }, ['user_id', 'server_id']);
    });
  }
}
