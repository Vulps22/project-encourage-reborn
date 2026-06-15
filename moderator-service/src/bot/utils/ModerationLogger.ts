import { Message, MessageCreateOptions, MessageEditOptions, Snowflake, TextChannel } from 'discord.js';
import { Question, Report, ServerProfile } from '@vulps22/project-encourage-types';
import { Config } from '../config';
import { Logger } from './Logger';
import { newQuestionView } from '../../views/moderation/newQuestionView';
import { userService, serverService } from '../../services';
import { serverView } from '../../views/moderation/serverView';
import { ReportView } from '../../views/moderation/reportView';
import { BanReason } from '../../services/ModerationService';

export class ModerationLogger {

  static async logQuestion(question: Question, channelId: Snowflake): Promise<Message | null> {
    const [userResult, serverResult] = await Promise.allSettled([
      userService.getUser(question.user_id),
      serverService.getServerSettings(question.server_id),
    ]);
    const user = userResult.status === 'fulfilled' ? userResult.value : null;
    const server = serverResult.status === 'fulfilled' ? serverResult.value : null;

    const ch = global.client.channels.cache.get(channelId) as TextChannel | undefined;
    if (!ch?.isTextBased()) return null;
    const view = await newQuestionView(question, null, user, server);
    return ch.send(view as MessageCreateOptions);
  }

  static async updateQuestionLog(question: Question, channelId: Snowflake, reasons: BanReason[] | null = null): Promise<Message | null> {
    Logger.debug(`Updating question log for question ID ${question.id} in channel ${channelId}`);
    if (!question.message_id) return null;

    const ch = global.client.channels.cache.get(channelId) as TextChannel | undefined;
    if (!ch?.isTextBased()) return null;
    try {
      const [userResult, serverResult] = await Promise.allSettled([
        userService.getUser(question.user_id),
        serverService.getServerSettings(question.server_id),
      ]);
      const user = userResult.status === 'fulfilled' ? userResult.value : null;
      const server = serverResult.status === 'fulfilled' ? serverResult.value : null;
      const existing = await ch.messages.fetch(question.message_id);
      const view = await newQuestionView(question, reasons as [] | null, user, server);
      return existing.edit(view as unknown as MessageEditOptions);
    } catch (err) {
      Logger.error(`Failed to update question log: ${JSON.stringify(err)}`);
      return null;
    }
  }

  static async logServer(server: ServerProfile): Promise<Message | null> {
    const ch = global.client.channels.cache.get(Config.SERVER_LOG_CHANNEL_ID) as TextChannel | undefined;
    if (!ch?.isTextBased()) return null;
    const view = await serverView(server);
    return ch.send(view as MessageCreateOptions);
  }

  static async updateServerLog(server: ServerProfile, reasons: BanReason[] | null = null): Promise<Message | null> {
    Logger.debug(`Updating server log for server ID ${server.id}`);
    if (!server.message_id) return null;

    const ch = global.client.channels.cache.get(Config.SERVER_LOG_CHANNEL_ID) as TextChannel | undefined;
    if (!ch?.isTextBased()) return null;
    try {
      const existing = await ch.messages.fetch(server.message_id);
      const view = await serverView(server, reasons as [] | null);
      return existing.edit(view as unknown as MessageEditOptions);
    } catch (err) {
      Logger.error(`Failed to update server log: ${JSON.stringify(err)}`);
      return null;
    }
  }

  static async logReport(report: Report): Promise<Message | null> {
    const ch = global.client.channels.cache.get(Config.REPORT_CHANNEL_ID) as TextChannel | undefined;
    if (!ch?.isTextBased()) return null;
    const view = ReportView(report, null);
    return ch.send(view as MessageCreateOptions);
  }

  static async updateReportLog(report: Report, reasons: BanReason[] | null = null): Promise<Message | null> {
    Logger.debug(`Updating report log for report ID ${report.id}`);
    if (!report.message_id) return null;

    const ch = global.client.channels.cache.get(Config.REPORT_CHANNEL_ID) as TextChannel | undefined;
    if (!ch?.isTextBased()) return null;
    try {
      const existing = await ch.messages.fetch(report.message_id);
      const view = ReportView(report, reasons as [] | null);
      return existing.edit(view as unknown as MessageEditOptions);
    } catch (err) {
      Logger.error(`Failed to update report log: ${JSON.stringify(err)}`);
      return null;
    }
  }
}
