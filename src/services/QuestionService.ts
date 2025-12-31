import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { QuestionType } from '../types';
import { Question } from '../interface';

export class QuestionService {
  constructor(private db: DatabaseService) {}


  async getQuestionById(id: number): Promise<Question | null> {
    return await this.db.get<Question>('question', 'questions', { id: BigInt(id) });
  }

  async getRandomQuestion(type: QuestionType): Promise<Question | null> {
    const result = await this.db.query<Question>(
      `SELECT * FROM "question"."questions" 
       WHERE type = $1 
       AND is_approved = true 
       AND is_banned = false 
       AND is_deleted = false
       ORDER BY RANDOM() 
       LIMIT 1`,
      [type]
    );

    return result.length > 0 ? result[0] : null;
  }

  async createQuestion(type: QuestionType, question: string, userId: Snowflake, serverId: Snowflake): Promise<Question | string> {
    if (question.length < 5) {
      return 'Question must be at least 5 characters long';
    }

    if (question.length > 500) {
      return 'Question must be 500 characters or less';
    }

    const result = await this.db.insert('question', 'questions', {
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

  async updateQuestion(id: number, data: Question): Promise<void> {
    await this.db.update('question', 'questions', data, { id: BigInt(id) });
  }

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

  /**
   * Ban all questions from a specific user
   * @param userId Discord user ID
   * @param moderatorId Discord moderator ID who is banning
   * @returns Number of questions banned
   */
  async banAllUserQuestions(userId: Snowflake, moderatorId: Snowflake): Promise<number> {
    const result = await this.db.update('question', 'questions', {
      is_banned: true,
      banned_by: BigInt(moderatorId),
      ban_reason: 'User Banned',
      datetime_banned: new Date()
    }, { 
      user_id: BigInt(userId),
      is_banned: false // Only ban questions that aren't already banned
    });

    return result.affectedRows;
  }

  /**
   * Unban all questions from a specific user that were banned due to user ban
   * @param userId Discord user ID
   * @returns Number of questions unbanned
   */
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
