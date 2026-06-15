import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Logger } from '../bot/utils';
import { Challenge, QuestionType } from '@vulps22/project-encourage-types';

export class ChallengeService {
  constructor(private db: DatabaseClient) {}

  /**
   * Creates a challenge row. Does not set message_id — call setMessageId after posting the embed.
   */
  async createChallenge(
    userId: Snowflake,
    questionId: number,
    serverId: Snowflake,
    channelId: Snowflake | null,
    username: string,
    type: QuestionType
  ): Promise<Challenge> {
    Logger.debug(`Creating challenge for user ${userId}`);
    const result = await this.db.createChallenge(userId, questionId, serverId, channelId, username, type);
    Logger.debug(`Challenge created with id ${result.id}`);
    return result;
  }

  /**
   * Set the Discord message ID on an existing challenge after the embed has been posted.
   */
  async setMessageId(challengeId: number, messageId: Snowflake): Promise<void> {
    Logger.debug(`Setting message_id ${messageId} on challenge ${challengeId}`);
    await this.db.setChallengeMessageId(challengeId, messageId);
  }

  /**
   * Fetch a challenge by its Discord message ID.
   */
  async getChallengeByMessageId(messageId: Snowflake): Promise<Challenge | null> {
    return this.db.getChallengeByMessageId(messageId);
  }

  /**
   * Mark a challenge as skipped.
   */
  async skip(challengeId: number): Promise<Challenge> {
    const result = await this.db.skipChallenge(challengeId);
    if (!result) throw new Error(`Failed to skip challenge ${challengeId}`);
    return result;
  }
}
