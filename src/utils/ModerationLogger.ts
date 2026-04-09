import { Message, MessageCreateOptions, Snowflake, TextChannel } from 'discord.js';
import { Question, Report } from '../interface';
import { ServerProfile } from '../interface/ServerProfileInterface';
import { Config } from '../config';
import { Logger } from './Logger';

/**
 * ModerationLogger - Handles logging for moderation messages (questions, reports, servers).
 *
 * Uses channel.send() via shard broadcast so that messages carry the bot's application_id,
 * which is required for interactive buttons to fire back at the bot.
 */
export class ModerationLogger {

  static async logQuestion(question: Question, channelId: Snowflake): Promise<Message | null> {
    let username = 'Unknown User';
    let guildName = 'Unknown Server';
    try {
      const user = await global.client.users.fetch(question.user_id);
      if (user) username = user.username;
    } catch { /* best-effort */ }
    try {
      const guild = await global.client.guilds.fetch(question.server_id);
      if (guild) guildName = guild.name;
    } catch { /* best-effort */ }

    const results = await global.client.shard!.broadcastEval(
      async (c, context) => {
        const ch = c.channels.cache.get(context.channelId);
        if (ch?.isTextBased()) {
          try {
            const path = await import('path');
            const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'newQuestionView.js');
            const { newQuestionView } = await import(viewPath);

            const questionData = {
              ...context.question,
              datetime_approved: context.question.datetime_approved ? new Date(context.question.datetime_approved) : null,
              datetime_banned: context.question.datetime_banned ? new Date(context.question.datetime_banned) : null,
              datetime_deleted: context.question.datetime_deleted ? new Date(context.question.datetime_deleted) : null,
              created: new Date(context.question.created)
            };

            const view = await newQuestionView(questionData, null, { username: context.username, guildName: context.guildName });
            const sentMessage = await (ch as TextChannel).send(view as MessageCreateOptions);
            return sentMessage;
          } catch (err) {
            console.error('[ModerationLogger] logQuestion failed on shard:', String(err));
            return null;
          }
        }
        return null;
      },
      { context: { channelId, question, username, guildName } }
    );

    return results.find(result => result !== null) as Message || null;
  }

  static async updateQuestionLog(question: Question, channelId: Snowflake, reasons: {}[] | null = null): Promise<Message | null> {
    Logger.debug(`Updating question log for question ID ${question.id} in channel ${channelId}`);
    if (!question.message_id) return null;

    const results = await global.client.shard!.broadcastEval(
      async (c, context) => {
        const ch = c.channels.cache.get(context.channelId);
        if (ch?.isTextBased()) {
          try {
            const existingMessage = await (ch as TextChannel).messages.fetch(context.messageId);
            if (!existingMessage) return { success: false, error: 'Message not found', message: null };

            const path = await import('path');
            const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'newQuestionView.js');
            const { newQuestionView } = await import(viewPath);

            const questionData = {
              ...context.question,
              datetime_approved: context.question.datetime_approved ? new Date(context.question.datetime_approved) : null,
              datetime_banned: context.question.datetime_banned ? new Date(context.question.datetime_banned) : null,
              datetime_deleted: context.question.datetime_deleted ? new Date(context.question.datetime_deleted) : null,
              created: new Date(context.question.created)
            };

            const view = await newQuestionView(questionData, context.reasons);
            const updatedMessage = await existingMessage.edit(view as any);
            return { success: true, error: null, message: updatedMessage };
          } catch (err) {
            return { success: false, error: String(err), message: null };
          }
        }
        return { success: false, error: 'Channel not found or not text-based', message: null };
      },
      { context: { channelId, question, messageId: question.message_id, reasons } }
    );

    const successResult = results.find(result => result && result.success);
    if (!successResult) {
      const errorResult = results.find(r => r && !r.success);
      if (errorResult) Logger.error(`Failed to update question log: ${errorResult.error}`);
    }
    return (successResult ? successResult.message : null) as Message | null;
  }

  static async logServer(server: ServerProfile): Promise<Message | null> {
    const results = await global.client.shard!.broadcastEval(
      async (c, context) => {
        const ch = c.channels.cache.get(context.channelId);
        if (ch?.isTextBased()) {
          try {
            const path = await import('path');
            const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'serverView.js');
            const { serverView } = await import(viewPath);

            const view = await serverView(context.server);
            const sentMessage = await (ch as TextChannel).send(view as MessageCreateOptions);
            return sentMessage;
          } catch (err) {
            console.error('[ModerationLogger] logServer failed on shard:', String(err));
            return null;
          }
        }
        return null;
      },
      { context: { channelId: Config.SERVER_LOG_CHANNEL_ID, server } }
    );

    return results.find(result => result !== null) as Message || null;
  }

  static async updateServerLog(server: ServerProfile, reasons: {}[] | null = null): Promise<Message | null> {
    Logger.debug(`Updating server log for server ID ${server.id}`);
    if (!server.message_id) return null;

    const results = await global.client.shard!.broadcastEval(
      async (c, context) => {
        const ch = c.channels.cache.get(context.channelId);
        if (ch?.isTextBased()) {
          try {
            const existingMessage = await (ch as TextChannel).messages.fetch(context.messageId);
            if (!existingMessage) return { success: false, error: 'Message not found', message: null };

            const path = await import('path');
            const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'serverView.js');
            const { serverView } = await import(viewPath);

            const view = await serverView(context.server, context.reasons);
            const updatedMessage = await existingMessage.edit(view as any);
            return { success: true, error: null, message: updatedMessage };
          } catch (err) {
            return { success: false, error: String(err), message: null };
          }
        }
        return { success: false, error: 'Channel not found or not text-based', message: null };
      },
      { context: { channelId: Config.SERVER_LOG_CHANNEL_ID, server, messageId: server.message_id, reasons } }
    );

    const successResult = results.find(result => result && result.success);
    if (!successResult) {
      const errorResult = results.find(r => r && !r.success);
      if (errorResult) Logger.error(`Failed to update server log: ${errorResult.error}`);
    }
    return (successResult ? successResult.message : null) as Message | null;
  }

  static async logReport(report: Report): Promise<Message | null> {
    const results = await global.client.shard!.broadcastEval(
      async (c, context) => {
        const ch = c.channels.cache.get(context.channelId);
        if (ch?.isTextBased()) {
          try {
            const path = await import('path');
            const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'reportView.js');
            const { ReportView } = await import(viewPath);

            const reportData = {
              ...context.report,
              created_at: context.report.created_at ? new Date(context.report.created_at) : undefined,
              updated_at: context.report.updated_at ? new Date(context.report.updated_at) : undefined
            };

            const view = await ReportView(reportData, null);
            const sentMessage = await (ch as TextChannel).send(view as MessageCreateOptions);
            return sentMessage;
          } catch (err) {
            console.error('[ModerationLogger] logReport failed on shard:', String(err));
            return null;
          }
        }
        return null;
      },
      { context: { channelId: Config.REPORT_CHANNEL_ID, report } }
    );

    return results.find(result => result !== null) as Message || null;
  }

  static async updateReportLog(report: Report, reasons: {}[] | null = null): Promise<Message | null> {
    Logger.debug(`Updating report log for report ID ${report.id}`);
    if (!report.message_id) return null;

    const results = await global.client.shard!.broadcastEval(
      async (c, context) => {
        const ch = c.channels.cache.get(context.channelId);
        if (ch?.isTextBased()) {
          try {
            const existingMessage = await (ch as TextChannel).messages.fetch(context.messageId);
            if (!existingMessage) return { success: false, error: 'Message not found', message: null };

            const path = await import('path');
            const viewPath = path.join(process.cwd(), 'dist', 'views', 'moderation', 'reportView.js');
            const { ReportView } = await import(viewPath);

            const reportData = {
              ...context.report,
              created_at: context.report.created_at ? new Date(context.report.created_at) : undefined,
              updated_at: context.report.updated_at ? new Date(context.report.updated_at) : undefined
            };

            const view = await ReportView(reportData, context.reasons);
            const updatedMessage = await existingMessage.edit(view as any);
            return { success: true, error: null, message: updatedMessage };
          } catch (err) {
            return { success: false, error: String(err), message: null };
          }
        }
        return { success: false, error: 'Channel not found or not text-based', message: null };
      },
      { context: { channelId: Config.REPORT_CHANNEL_ID, report, messageId: report.message_id, reasons } }
    );

    const successResult = results.find(result => result && result.success);
    if (!successResult) {
      const errorResult = results.find(r => r && !r.success);
      if (errorResult) Logger.error(`Failed to update report log: ${errorResult.error}`);
    }
    return (successResult ? successResult.message : null) as Message | null;
  }
}
