import { Snowflake } from 'discord.js';
import { Logger } from '../utils';
import { Challenge } from '../interface';
import { QuestionType } from '../types';
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

    const challenge = await dsClient.post<Challenge>('/challenge', undefined, {
      user_id: userId,
      question_id: questionId,
      server_id: serverId,
      channel_id: channelId,
      username,
      type,
    });

    Logger.debug(`Challenge created with id ${challenge.id}`);
    return challenge;
  }

  async setMessageId(challengeId: number, messageId: Snowflake): Promise<void> {
    Logger.debug(`Setting message_id ${messageId} on challenge ${challengeId}`);
    await dsClient.patch('/challenge/:id/message', { id: challengeId }, { message_id: messageId });
  }

  async getChallengeByMessageId(messageId: Snowflake): Promise<Challenge | null> {
    try {
      return await dsClient.get<Challenge>('/challenge/message/:messageId', { messageId });
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async skip(challengeId: number): Promise<Challenge> {
    return dsClient.patch<Challenge>('/challenge/:id/skip', { id: challengeId });
  }
}
