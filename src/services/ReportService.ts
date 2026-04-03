import { Snowflake } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils';
import { Report, ReportStatus } from '../interface';
import { TargetType } from '../types';

declare const global: { client: import('discord.js').Client };

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
    content: string | null,
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
      ban_reason: null,
      content: content
    };

    const res = (await this.db.insert('moderation', 'reports', reportData))!.rows![0] as Report;

    const logMessage = await Logger.logReport(res);
    
    // Update the report with the message ID from the log
    if (logMessage?.id) {
      await this.db.update(
        'moderation',
        'reports',
        { message_id: logMessage.id },
        { id: res.id }
      );
      res.message_id = logMessage.id;
    }

    Logger.debug(`Report ${res.id} created successfully`);
    return res;
  }

  /**
   * Notify the reporter of a report via DM
   * Fails silently if the user has DMs disabled or shares no server with the bot
   * @param report - The report to notify about
   * @param message - The message to send to the reporter
   */
  async notifyReporter(report: Report, message: string): Promise<void> {
    try {
      const user = await global.client.users.fetch(report.sender_id);
      await user.send(message);
      Logger.debug(`Notified reporter ${report.sender_id} for report ${report.id}`);
    } catch (error) {
      Logger.debug(`Could not notify reporter ${report.sender_id} for report ${report.id}: ${error}`);
    }
  }
}
