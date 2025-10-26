import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { QuestionType } from '../types';
import { Question } from '../interface';

export class QuestionService {
  constructor(private db: DatabaseService) {}

  async createQuestion(type: QuestionType, question: string, userId: Snowflake, serverId: Snowflake): Promise<Question |string> {
    if (question.length < 5) {
      return 'Question must be at least 5 characters long';
    }

    if (question.length > 500) {
      return 'Question must be 500 characters or less';
    }

    const result = await this.db.insert('core', 'questions', {
      type,
      question,
      user_id: userId,
      server_id: serverId,
      is_approved: false,
      is_banned: false,
    });

    if (!result.insertId) {
      throw new Error('Failed to insert question');
    }

    if (!result.rows || result.rows.length === 0) {
      throw new Error('No question returned after insert');
    }

    return result.rows[0] as Question;
  }
}
