import { Question, QuestionType, Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class QuestionService {
  constructor(private db: DatabaseService) {}

  async getById(id: number): Promise<Question | null> {
    return await this.db.get<Question>('question', 'questions', { id });
  }

  async getRandom(type?: QuestionType): Promise<Question | null> {
    const conditions: string[] = [
      'is_approved = true',
      'is_banned = false',
      'is_deleted = false',
    ];
    const params: unknown[] = [];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const result = await this.db.query<Question>(
      `SELECT * FROM "question"."questions" WHERE ${where} ORDER BY RANDOM() LIMIT 1`,
      params
    );

    return result.length > 0 ? result[0] : null;
  }

  async create(
    type: QuestionType,
    question: string,
    userId: Snowflake,
    serverId: Snowflake
  ): Promise<Question> {
    console.log(`[DEBUG DS/QuestionService] create — type=${type} userId=${userId} serverId=${serverId}`);
    const result = await this.db.insert('question', 'questions', {
      type,
      question,
      user_id: userId,
      server_id: serverId,
      is_approved: false,
      is_banned: false,
    });
    console.log(`[DEBUG DS/QuestionService] db.insert result — insertId=${result.insertId} affectedRows=${result.affectedRows} rowCount=${result.rows?.length}`);

    if (!result.insertId || !result.rows || result.rows.length === 0) {
      console.log(`[DEBUG DS/QuestionService] Insert failed — no insertId or rows returned`);
      throw new Error('Failed to create question');
    }

    const created = result.rows[0] as Question;
    console.log(`[DEBUG DS/QuestionService] Returning question id=${created.id}`);
    return created;
  }

  async approve(id: number, moderatorId: Snowflake): Promise<Question | null> {
    const result = await this.db.update('question', 'questions', {
      is_approved: true,
      approved_by: moderatorId,
      datetime_approved: new Date(),
      is_banned: false,
      ban_reason: null,
      banned_by: null,
      datetime_banned: null,
    }, { id });

    return result.rows && result.rows.length > 0 ? result.rows[0] as Question : null;
  }

  async ban(id: number, moderatorId: Snowflake, banReason: string): Promise<Question | null> {
    const result = await this.db.update('question', 'questions', {
      is_banned: true,
      banned_by: moderatorId,
      ban_reason: banReason,
      datetime_banned: new Date(),
    }, { id });

    return result.rows && result.rows.length > 0 ? result.rows[0] as Question : null;
  }

  async update(id: number, data: Partial<Question>): Promise<Question | null> {
    const { id: _id, ...safeData } = data;
    const result = await this.db.update('question', 'questions', safeData as Record<string, unknown>, { id });
    return result.rows && result.rows.length > 0 ? result.rows[0] as Question : null;
  }

  async setMessageId(id: number, messageId: Snowflake): Promise<void> {
    await this.db.update('question', 'questions', { message_id: messageId }, { id });
  }

  async countByUser(userId: Snowflake, approved?: boolean, banned?: boolean): Promise<number> {
    const conditions: Record<string, unknown> = { user_id: userId };
    if (approved !== undefined) conditions.is_approved = approved;
    if (banned !== undefined) conditions.is_banned = banned;
    return await this.db.count('question', 'questions', conditions);
  }

  async countByServer(serverId: Snowflake, approved?: boolean, banned?: boolean): Promise<number> {
    const conditions: Record<string, unknown> = { server_id: serverId };
    if (approved !== undefined) conditions.is_approved = approved;
    if (banned !== undefined) conditions.is_banned = banned;
    return await this.db.count('question', 'questions', conditions);
  }

  async search(text: string, limit = 25): Promise<Question[]> {
    if (!text) {
      return await this.db.query<Question>(
        `SELECT * FROM "question"."questions" WHERE is_deleted = false LIMIT $1`,
        [limit]
      );
    }
    return await this.db.query<Question>(
      `SELECT * FROM "question"."questions" WHERE question ILIKE $1 AND is_deleted = false LIMIT $2`,
      [`%${text}%`, limit]
    );
  }

  async banAllByUser(userId: Snowflake, moderatorId: Snowflake): Promise<number> {
    const result = await this.db.update('question', 'questions', {
      is_banned: true,
      banned_by: moderatorId,
      ban_reason: 'User Banned',
      datetime_banned: new Date(),
    }, {
      user_id: userId,
      is_banned: false,
    });
    return result.affectedRows;
  }

  async unbanUserBanned(userId: Snowflake): Promise<number> {
    const result = await this.db.update('question', 'questions', {
      is_banned: false,
      banned_by: null,
      ban_reason: null,
      datetime_banned: null,
    }, {
      user_id: userId,
      is_banned: true,
      ban_reason: 'User Banned',
    });
    return result.affectedRows;
  }
}
