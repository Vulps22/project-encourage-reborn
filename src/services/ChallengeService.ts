import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { Challenge } from '../interface';
import { QuestionType } from '../types';

export class ChallengeService {
  constructor(private db: DatabaseService) {}

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

    const result = await this.db.insert('challenge', 'challenges', {
      user_id: userId,
      question_id: questionId,
      server_id: serverId,
      channel_id: channelId ?? null,
      username,
      type,
    });

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to create challenge for user ${userId}`);
    }

    Logger.debug(`Challenge created with id ${(result.rows[0] as Challenge).id}`);
    return result.rows[0] as Challenge;
  }

  /**
   * Set the Discord message ID on an existing challenge after the embed has been posted.
   */
  async setMessageId(challengeId: number, messageId: Snowflake): Promise<void> {
    Logger.debug(`Setting message_id ${messageId} on challenge ${challengeId}`);

    await this.db.update(
      'challenge', 'challenges',
      { message_id: messageId },
      { id: challengeId }
    );
  }

  /**
   * Fetch a challenge by its Discord message ID.
   */
  async getChallengeByMessageId(messageId: Snowflake): Promise<Challenge | null> {
    return this.db.get<Challenge>('challenge', 'challenges', { message_id: messageId });
  }

  /**
   * Mark a challenge as skipped.
   */
  async skip(challengeId: number): Promise<Challenge> {
    const result = await this.db.update(
      'challenge', 'challenges',
      { skipped: true },
      { id: challengeId }
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to skip challenge ${challengeId}`);
    }

    return result.rows[0] as Challenge;
  }
}
