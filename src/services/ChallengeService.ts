import { Snowflake } from 'discord.js';
import { Logger } from '@vulps22/logger';
import { Challenge, QuestionType } from '@vulps22/project-encourage-types';
import { dsClient, DSError } from '../client';

export class ChallengeService {
  async createChallenge(
    userId: Snowflake,
    questionId: number,
    serverId: Snowflake,
    channelId: Snowflake | null,
    username: string,
    type: QuestionType
  ): Promise<Challenge> {
    Logger.debug(`Creating challenge for user ${userId}`);

    const challenge = await dsClient.createChallenge(userId, questionId, serverId, channelId, username, type);

    Logger.debug(`Challenge created with id ${challenge.id}`);
    return challenge;
  }

  async setMessageId(challengeId: number, messageId: Snowflake): Promise<void> {
    Logger.debug(`Setting message_id ${messageId} on challenge ${challengeId}`);
    await dsClient.setChallengeMessageId(challengeId, messageId);
  }

  async getChallengeByMessageId(messageId: Snowflake): Promise<Challenge | null> {
    try {
      return await dsClient.getChallengeByMessageId(messageId);
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async skip(challengeId: number): Promise<Challenge> {
    return dsClient.skipChallenge(challengeId);
  }
}
