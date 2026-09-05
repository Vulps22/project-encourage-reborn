import { Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Logger } from '../bot/utils';

export class AnalyticsService {
  constructor(private db: DatabaseClient) {}

  /**
   * Fires the interaction event log to DS without awaiting it — analytics
   * must never add latency to, or be able to fail, the real interaction.
   * No-ops for non-initiator interactions (continuations of a flow that
   * already logged its own initiating event).
   */
  logEvent(
    interactionType: 'command' | 'button',
    interactionName: string,
    isInitiator: boolean,
    userId: Snowflake,
    guildId: Snowflake | null
  ): void {
    if (!isInitiator) return;

    this.db.logAnalyticsEvent(interactionType, interactionName, userId, guildId).catch((error) => {
      Logger.error(`Failed to log analytics event (${interactionType}:${interactionName}): ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}
