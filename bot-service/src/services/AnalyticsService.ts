import { Snowflake } from 'discord.js';
import { Logger } from '@vulps22/logger';
import { dsClient } from '../client';

export class AnalyticsService {
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

    dsClient.logAnalyticsEvent(interactionType, interactionName, userId, guildId).catch((error) => {
      Logger.error(`Failed to log analytics event (${interactionType}:${interactionName}): ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}
