import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import type { QuestionType, Question } from '@vulps22/project-encourage-types';

export class QuestionService {
  constructor(private db: DatabaseClient) {}

  async getQuestionById(id: number): Promise<Question | null> {
    return this.db.getQuestion(id);
  }

  async getRandomQuestion(type: QuestionType): Promise<Question | null> {
    return this.db.getRandomQuestion(type);
  }

  async createQuestion(type: QuestionType, question: string, userId: Snowflake, serverId: Snowflake): Promise<Question | string> {
    if (question.length < 5) return 'Question must be at least 5 characters long';
    if (question.length > 500) return 'Question must be 500 characters or less';
    return this.db.createQuestion(type, question, userId, serverId);
  }

  async updateQuestion(id: number, data: Question): Promise<void> {
    await this.db.updateQuestion(id, data);
  }

  async getUserQuestionCount(userId: Snowflake): Promise<number> {
    return this.db.countQuestionsByUser(userId);
  }

  async getUserApprovedQuestionCount(userId: Snowflake): Promise<number> {
    return this.db.countQuestionsByUser(userId, true, false);
  }

  async getUserBannedQuestionCount(userId: Snowflake): Promise<number> {
    return this.db.countQuestionsByUser(userId, undefined, true);
  }

  async getServerQuestionCount(serverId: Snowflake): Promise<number> {
    return this.db.countQuestionsByServer(serverId);
  }

  async getServerApprovedQuestionCount(serverId: Snowflake): Promise<number> {
    return this.db.countQuestionsByServer(serverId, true, false);
  }

  async getServerBannedQuestionCount(serverId: Snowflake): Promise<number> {
    return this.db.countQuestionsByServer(serverId, undefined, true);
  }

  async banAllUserQuestions(userId: Snowflake, moderatorId: Snowflake): Promise<number> {
    return this.db.banUserQuestions(userId, moderatorId);
  }

  async setMessageId(questionId: number, messageId: Snowflake): Promise<void> {
    await this.db.updateQuestion(questionId, { message_id: messageId } as Partial<Question>);
  }

  async unbanUserBannedQuestions(userId: Snowflake): Promise<number> {
    return this.db.unbanUserQuestions(userId);
  }
}
