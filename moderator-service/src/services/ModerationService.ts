import { DatabaseClient } from '../bot/services/DatabaseClient';
import { Question, Report, ReportStatus, QuestionType, TargetType } from '@vulps22/project-encourage-types';
import { Logger, ModerationLogger } from '../bot/utils';
import { Message, Snowflake } from 'discord.js';
import { banReasons } from '../bot/config';

//TODO: move into own file
export interface BanReason {
  label: string;
  value: string;
  // add other fields if they exist, like 'description'
}

 
export class ModerationService {
  constructor(private db: DatabaseClient) {}

  async sendToApprovalQueue(question: Question): Promise<Snowflake> {
    Logger.debug(`Sending question ${question.id} to approval queue`);
    try {
      const channelId = question.type === QuestionType.Truth
        ? global.config.TRUTHS_LOG_CHANNEL_ID
        : global.config.DARES_LOG_CHANNEL_ID;

      if (!channelId) {
        throw new Error(`No log channel configured for ${question.type} questions`);
      }

      const message: Message | null = await ModerationLogger.logQuestion(question, channelId);
      if (!message) throw new Error('Failed to log question message for approval');
      Logger.debug(`Question ${question.id} would be sent to approval queue in channel ${channelId}`);
      return message.id;
    } catch (error) {
      Logger.debug(`Failed to send question ${question.id} to approval queue: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async approveQuestion(questionId: string, moderatorId: string): Promise<void> {
    Logger.debug(`Approving question ${questionId} by moderator ${moderatorId}`);
    try {
      const result = await this.db.approveQuestion(parseInt(questionId), moderatorId);
      if (!result) throw new Error(`Question with ID ${questionId} not found`);
      Logger.debug(`Question ${questionId} approved successfully`);
    } catch (error) {
      Logger.debug(`Failed to approve question ${questionId}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async banQuestion(questionId: string, moderatorId: string, reason: string): Promise<void> {
    Logger.debug(`Banning question ${questionId} by moderator ${moderatorId} with reason: ${reason}`);
    try {
      const result = await this.db.banQuestion(parseInt(questionId), moderatorId, reason);
      if (!result) throw new Error(`Question with ID ${questionId} not found`);
      Logger.debug(`Question ${questionId} banned successfully`);
    } catch (error) {
      Logger.debug(`Failed to ban question ${questionId}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async banServer(serverId: string, moderatorId: string, reason: string): Promise<void> {
    Logger.debug(`Banning server ${serverId} by moderator ${moderatorId} with reason: ${reason}`);
    try {
      const result = await this.db.banServer(serverId, moderatorId, reason);
      if (!result) throw new Error(`Server with ID ${serverId} not found`);
      Logger.debug(`Server ${serverId} banned successfully`);
    } catch (error) {
      Logger.debug(`Failed to ban server ${serverId}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  getBanReasons(type: TargetType): BanReason[] {
    return banReasons[type];
  }

  getBanReasonLabel(type: TargetType, value: string): string {
    const reasons = banReasons[type] as { label: string; value: string }[];
    const label = reasons.find(r => r.value === value)?.label ?? value;
    return label.replace(/^\d+ - /, '');
  }

  async clearReport(reportId: number, moderatorId: string): Promise<void> {
    Logger.log(`Clearing report ${reportId} by moderator ${moderatorId}`);
    try {
      const activeReport = await this.db.getReport(reportId);
      if (!activeReport) throw new Error(`Report with ID ${reportId} not found`);

      const reportsToClear = await this.findActioningReports(activeReport.offender_id);

      for (const report of reportsToClear) {
        const updated = await this.db.updateReport(report.id!, {
          status: ReportStatus.CLEARED,
          moderator_id: moderatorId,
        });
        if (!updated) {
          Logger.error('Unexpectedly failed to clear report');
          throw new Error('Unexpectedly failed to clear Report');
        }
        await ModerationLogger.updateReportLog(updated);
      }

      Logger.debug(`Report ${reportId} cleared successfully`);
    } catch (error) {
      Logger.error(`Failed to clear report ${reportId}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async actioningReport(reportId: number, moderatorId: string): Promise<Report> {
    Logger.log(`Marking report ${reportId} as actioning by moderator ${moderatorId}`);
    try {
      const updated = await this.db.updateReport(reportId, {
        status: ReportStatus.ACTIONING,
        moderator_id: moderatorId,
      });
      if (!updated) throw new Error(`Report with ID ${reportId} not found`);
      Logger.debug(`Report ${reportId} marked as actioning successfully`);
      return updated;
    } catch (error) {
      Logger.error(`Failed to mark report ${reportId} as actioning: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async findActioningReports(offenderId: string): Promise<Report[]> {
    return this.db.listReports(offenderId, [ReportStatus.PENDING, ReportStatus.ACTIONING]);
  }

  async getReport(reportId: number): Promise<Report | null> {
    return this.db.getReport(reportId);
  }

  async actionedReport(reportId: number, moderatorId: string): Promise<void> {
    Logger.log(`Marking report ${reportId} as actioned by moderator ${moderatorId}`);
    try {
      const activeReport = await this.db.getReport(reportId);
      if (!activeReport) throw new Error(`Report with ID ${reportId} not found`);

      const reportsToAction = await this.findActioningReports(activeReport.offender_id);

      for (const report of reportsToAction) {
        const updated = await this.db.updateReport(report.id!, {
          status: ReportStatus.ACTIONED,
          moderator_id: moderatorId,
        });
        if (!updated) {
          Logger.error('Unexpectedly failed to mark report as actioned');
          throw new Error('Unexpectedly failed to mark report as actioned');
        }
        await ModerationLogger.updateReportLog(updated);
      }

      Logger.debug(`Report ${reportId} marked as actioned successfully`);
    } catch (error) {
      Logger.error(`Failed to mark report ${reportId} as actioned: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async resetReport(reportId: number): Promise<Report> {
    Logger.debug(`Resetting report ${reportId} to pending`);
    const report = await this.db.updateReport(reportId, { status: ReportStatus.PENDING, moderator_id: null });
    if (!report) throw new Error(`Report with ID ${reportId} not found after reset`);
    return report;
  }
}
