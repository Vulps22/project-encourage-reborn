import { Snowflake } from 'discord.js';
import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Logger, ModerationLogger } from '../bot/utils';
import { Report, TargetType } from '@vulps22/project-encourage-types';

declare const global: { client: import('discord.js').Client };

export class ReportService {
  constructor(private db: DatabaseClient) {}

  async createReport(
    senderId: Snowflake,
    offenderId: string,
    content: string | null,
    type: TargetType,
    serverId: Snowflake,
    reason: string = 'No reason provided'
  ): Promise<Report> {
    Logger.debug(`Creating ${type} report from user ${senderId} for ${offenderId}`);

    const res = await this.db.createReport({
      type,
      reason,
      content,
      sender_id: senderId,
      offender_id: offenderId,
      server_id: serverId,
      moderator_id: null,
      ban_reason: null,
    });

    const logMessage = await ModerationLogger.logReport(res);

    if (logMessage?.id) {
      const updated = await this.db.updateReport(res.id!, { message_id: logMessage.id });
      if (updated) {
        res.message_id = logMessage.id;
      }
    }

    Logger.debug(`Report ${res.id} created successfully`);
    return res;
  }

  async notifyReporter(report: Report, message: string): Promise<void> {
    Logger.log("BYpassing Notification fror playtest");
    return;
    try {
      const user = await global.client.users.fetch(report.sender_id);
      await user.send(message);
      Logger.debug(`Notified reporter ${report.sender_id} for report ${report.id}`);
    } catch (error) {
      Logger.debug(`Could not notify reporter ${report.sender_id} for report ${report.id}: ${JSON.stringify(error)}`);
    }
  }
}
