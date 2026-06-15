import { Report, ReportStatus, Snowflake } from '@vulps22/project-encourage-types';
import { DatabaseService } from '../db/DatabaseService';

export class ReportService {
  constructor(private db: DatabaseService) {}

  async getById(id: number): Promise<Report | null> {
    return await this.db.get<Report>('moderation', 'report_view', { id });
  }

  async list(offenderId: string, statuses: ReportStatus[]): Promise<Report[]> {
    if (statuses.length === 0) return [];
    const placeholders = statuses.map((_, i) => `$${i + 2}`).join(', ');
    return await this.db.query<Report>(
      `SELECT * FROM "moderation"."report_view" WHERE offender_id = $1 AND status IN (${placeholders})`,
      [offenderId, ...statuses]
    );
  }

  async create(data: {
    type: string;
    reason: string;
    content: string | null;
    status: ReportStatus;
    sender_id: Snowflake;
    offender_id: string;
    server_id: Snowflake;
    moderator_id: Snowflake | null;
    ban_reason: string | null;
  }): Promise<Report> {
    const result = await this.db.insert('moderation', 'reports', data);

    if (!result.insertId || !result.rows || result.rows.length === 0) {
      throw new Error('Failed to create report');
    }

    const report = await this.getById(result.insertId);
    if (!report) throw new Error('Failed to fetch report after creation');
    return report;
  }

  async update(id: number, data: Partial<{
    status: ReportStatus;
    moderator_id: Snowflake | null;
    message_id: Snowflake | null;
    ban_reason: string | null;
  }>): Promise<Report | null> {
    const result = await this.db.update('moderation', 'reports', data as Record<string, unknown>, { id });
    if (result.affectedRows === 0) return null;
    return await this.getById(id);
  }
}
