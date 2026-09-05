import { Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export type AnalyticsOrigin = 'bs' | 'ms';
export type AnalyticsInteractionType = 'command' | 'button';

export class AnalyticsService {
  constructor(private db: DatabaseService) {}

  async logEvent(
    service: AnalyticsOrigin,
    interactionType: AnalyticsInteractionType,
    interactionName: string,
    userId: Snowflake,
    guildId: Snowflake | null
  ): Promise<void> {
    await this.db.insert('analytics', 'events', {
      service,
      interaction_type: interactionType,
      interaction_name: interactionName,
      user_id: userId,
      guild_id: guildId,
    });
  }
}
