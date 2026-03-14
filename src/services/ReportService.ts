import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { Report, ReportStatus } from '../interface';
import { TargetType } from '../types';

export class ReportService {
  constructor(private db: DatabaseService) {}

  /**
   * Create a new report and send it to the log channel
   * @param senderId Discord user ID of the reporter
   * @param offenderId ID of the reported content (question ID or server ID)
   * @param type Type of report (Question or Server)
   * @param serverId Discord server ID where the report was made
   * @param reason Optional reason for the report
   * @returns The created report
   */
  async createReport(
    senderId: Snowflake,
    offenderId: string,
    type: TargetType,
    serverId: Snowflake,
    reason: string = 'No reason provided'
  ): Promise<Report> {
    Logger.debug(`Creating ${type} report from user ${senderId} for ${offenderId}`);

    const reportData = {
      type,
      reason,
      status: ReportStatus.PENDING,
      sender_id: senderId,
      offender_id: offenderId,
      server_id: serverId,
      moderator_id: null,
      ban_reason: null
    };

    const res = (await this.db.insert('moderation', 'reports', reportData))!.rows![0] as Report;

    await Logger.logReport(res);

    Logger.debug(`Report ${res.id} created successfully`);
    return res;
  }
}
