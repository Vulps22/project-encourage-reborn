import { Snowflake } from 'discord.js';
import { dsClient, DSError } from '../client';
import { Question, QuestionType } from '@vulps22/project-encourage-types';

export class QuestionService {

  async getQuestionById(id: number): Promise<Question | null> {
    try {
      return await dsClient.getQuestion(id);
    } catch (error) {
      if (error instanceof DSError && error.status === 404) return null;
      throw error;
    }
  }

  async getRandomQuestion(type: QuestionType): Promise<Question | null> {
    try {
      return await dsClient.getRandomQuestion(type);
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
    const result = await dsClient.createQuestion(type, question, userId, serverId);
    console.log(`[DEBUG PE/QuestionService] DS responded — question.id=${result.id}`);
    return result;
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<void> {
    await dsClient.updateQuestion(id, data);
  }

}
