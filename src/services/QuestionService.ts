import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { dsClient, DSError } from '../client';
import { Question, QuestionType } from '@vulps22/project-encourage-types';

export class QuestionService {
  constructor(private db: DatabaseService) {}

  async getQuestionById(id: number): Promise<Question | null> {
    try {
      return await dsClient.get<Question>('/question/:id', { id });
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async getRandomQuestion(type: QuestionType): Promise<Question | null> {
    try {
      return await dsClient.get<Question>('/question/random', undefined, { type });
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async createQuestion(type: QuestionType, question: string, userId: Snowflake, serverId: Snowflake): Promise<Question | string> {
    console.log(`[DEBUG PE/QuestionService] createQuestion — type=${type} userId=${userId} serverId=${serverId} length=${question.length}`);
    if (question.length < 5) {
      console.log(`[DEBUG PE/QuestionService] Rejected: question too short (${question.length} chars)`);
      return 'Question must be at least 5 characters long';
    }

    if (question.length > 500) {
      console.log(`[DEBUG PE/QuestionService] Rejected: question too long (${question.length} chars)`);
      return 'Question must be 500 characters or less';
    }

    console.log(`[DEBUG PE/QuestionService] POSTing to DS /question`);
    const result = await dsClient.post<Question>('/question', undefined, {
      type,
      question,
      user_id: userId,
      server_id: serverId,
    });
    console.log(`[DEBUG PE/QuestionService] DS responded — question.id=${result.id}`);
    return result;
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<void> {
    await dsClient.patch<Question>('/question/:id', { id }, data);
  }

  // TODO: Needs DS endpoint — used by profile builders
  async getUserQuestionCount(userId: Snowflake): Promise<number> {
    return await this.db.count('question', 'questions', { user_id: BigInt(userId) });
  }

  async getUserApprovedQuestionCount(userId: Snowflake): Promise<number> {
    return await this.db.count('question', 'questions', {
      user_id: BigInt(userId),
      is_approved: true,
      is_banned: false
    });
  }

  async getUserBannedQuestionCount(userId: Snowflake): Promise<number> {
    return await this.db.count('question', 'questions', {
      user_id: BigInt(userId),
      is_banned: true
    });
  }

  async getServerQuestionCount(serverId: Snowflake): Promise<number> {
    return await this.db.count('question', 'questions', { server_id: BigInt(serverId) });
  }

  async getServerApprovedQuestionCount(serverId: Snowflake): Promise<number> {
    return await this.db.count('question', 'questions', {
      server_id: BigInt(serverId),
      is_approved: true,
      is_banned: false
    });
  }

  async getServerBannedQuestionCount(serverId: Snowflake): Promise<number> {
    return await this.db.count('question', 'questions', {
      server_id: BigInt(serverId),
      is_banned: true
    });
  }

  // TODO: Needs DS endpoint — used by moderation handlers
  async banAllUserQuestions(userId: Snowflake, moderatorId: Snowflake): Promise<number> {
    const result = await this.db.update('question', 'questions', {
      is_banned: true,
      banned_by: BigInt(moderatorId),
      ban_reason: 'User Banned',
      datetime_banned: new Date()
    }, {
      user_id: BigInt(userId),
      is_banned: false
    });

    return result.affectedRows;
  }

  async unbanUserBannedQuestions(userId: Snowflake): Promise<number> {
    const result = await this.db.update('question', 'questions', {
      is_banned: false,
      banned_by: null,
      ban_reason: null,
      datetime_banned: null
    }, {
      user_id: BigInt(userId),
      is_banned: true,
      ban_reason: 'User Banned'
    });

    return result.affectedRows;
  }
}
