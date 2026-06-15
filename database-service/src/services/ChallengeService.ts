import { Challenge, QuestionType, Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class ChallengeService {
  constructor(private db: DatabaseService) {}

  async create(
    userId: Snowflake,
    questionId: number,
    serverId: Snowflake,
    channelId: Snowflake | null,
    username: string,
    type: QuestionType
  ): Promise<Challenge> {
    const result = await this.db.insert('challenge', 'challenges', {
      user_id: userId,
      question_id: questionId,
      server_id: serverId,
      channel_id: channelId,
      username,
      type,
    });

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to create challenge');
    }

    return result.rows[0] as Challenge;
  }

  async getById(id: number): Promise<Challenge | null> {
    return this.db.get<Challenge>('challenge', 'challenges', { id });
  }

  async getByMessageId(messageId: Snowflake): Promise<Challenge | null> {
    return this.db.get<Challenge>('challenge', 'challenges', { message_id: messageId });
  }

  async setMessageId(id: number, messageId: Snowflake): Promise<void> {
    await this.db.update('challenge', 'challenges', { message_id: messageId }, { id });
  }

  async skip(id: number): Promise<Challenge | null> {
    const result = await this.db.update('challenge', 'challenges', { skipped: true }, { id });
    return result.rows && result.rows.length > 0 ? result.rows[0] as Challenge : null;
  }
}
