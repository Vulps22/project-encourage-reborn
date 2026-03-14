import { DatabaseService } from './DatabaseService';
import { Question, Report, ReportStatus } from '../interface';
import { Logger } from '../utils';
import { QuestionType, TargetType } from '../types';
import { Message, Snowflake } from 'discord.js';
import { banReasons } from '../config';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class ModerationService {
    constructor(private db: DatabaseService) {}

    /**
     * Send a question to the approval queue for moderation
     * @param question - The question to send for approval
     */
    async sendToApprovalQueue(question: Question): Promise<Snowflake> {
        Logger.debug(`Sending question ${question.id} to approval queue`);
        try {
            // Determine which channel to send to based on question type
            const channelId = question.type === QuestionType.Truth
                ? global.config.TRUTHS_LOG_CHANNEL_ID
                : global.config.DARES_LOG_CHANNEL_ID;

            if (!channelId) {
                throw new Error(`No log channel configured for ${question.type} questions`);
            }

            const message: Message | null = await Logger.logQuestion(question, channelId);
            if (!message) throw new Error("Failed to log question message for approval");
            // For now, just log that it would be sent
            Logger.debug(`Question ${question.id} would be sent to approval queue in channel ${channelId}`);
            return message.id;

        } catch (error) {
            Logger.debug(`Failed to send question ${question.id} to approval queue: ${error}`);
            throw error;
        }
    }

    /**
     * Approve a question
     * @param questionId - ID of the question to approve
     * @param moderatorId - ID of the moderator approving
     */
    async approveQuestion(questionId: string, moderatorId: string): Promise<void> {
        Logger.debug(`Approving question ${questionId} by moderator ${moderatorId}`);
        
        try {
            // Update the question in the database
            const result = await this.db.update(
                'question',
                'questions',
                {
                    is_approved: true,
                    approved_by: BigInt(moderatorId),
                    is_banned: false,
                    datetime_approved: new Date()
                },
                { id: parseInt(questionId) }
            );

            if (result.affectedRows === 0) {
                throw new Error(`Question with ID ${questionId} not found`);
            }

            Logger.debug(`Question ${questionId} approved successfully`);
            
        } catch (error) {
            Logger.debug(`Failed to approve question ${questionId}: ${error}`);
            throw error;
        }
    }

    /**
     * Ban a question with a specific reason
     * @param questionId - ID of the question to ban
     * @param moderatorId - ID of the moderator banning
     * @param reason - Reason for banning
     */
    async banQuestion(questionId: string, moderatorId: string, reason: string): Promise<void> {
        Logger.debug(`Banning question ${questionId} by moderator ${moderatorId} with reason: ${reason}`);
        
        try {
            // Update the question in the database
            const result = await this.db.update(
                'question',
                'questions',
                {
                    is_approved: false,
                    is_banned: true,
                    banned_by: BigInt(moderatorId),
                    ban_reason: reason,
                    datetime_banned: new Date()
                },
                { id: parseInt(questionId) }
            );

            if (result.affectedRows === 0) {
                throw new Error(`Question with ID ${questionId} not found`);
            }

            Logger.debug(`Question ${questionId} banned successfully`);
            
        } catch (error) {
            Logger.debug(`Failed to ban question ${questionId}: ${error}`);
            throw error;
        }
    }

    async banServer(serverId: string, moderatorId: string, reason: string): Promise<void> {
        Logger.debug(`Banning server ${serverId} by moderator ${moderatorId} with reason: ${reason}`);
        try {
            const result = await this.db.update(
                'server',
                'servers',
                {
                    can_create: false,
                    is_banned: true,
                    banned_by: moderatorId,
                    ban_reason: reason,
                    datetime_banned: new Date()
                },
                { id: BigInt(serverId) }
            );

            if(result.affectedRows === 0) {
                throw new Error(`Server with ID ${serverId} not found`);
            }

            Logger.debug(`Server ${serverId} banned successfully`);
        } catch (error) {
            Logger.debug(`Failed to ban server ${serverId}: ${error}`);
            throw error;
        }
    }

    /**
     * Get ban reasons for a specific target type
     * @param type - The type of target (User, Server, Question)
     * @returns Array of ban reason options
     */
    getBanReasons(type: TargetType): {}[]{
        return banReasons[type];
    }

    /**
     * Get the human-readable label for a ban reason value
     * @param type - The type of target (User, Server, Question)
     * @param value - The raw ban reason value (e.g. "hate_speech")
     * @returns The label string, or the raw value if not found
     */
    getBanReasonLabel(type: TargetType, value: string): string {
        const reasons = banReasons[type] as { label: string; value: string }[];
        const label = reasons.find(r => r.value === value)?.label ?? value;
        return label.replace(/^\d+ - /, '');
    }

    /**
     * Clear a report (mark as resolved without action)
     * @param reportId - ID of the report to clear
     * @param moderatorId - ID of the moderator clearing the report
     * @returns Updated report object
     */
    async clearReport(reportId: number, moderatorId: string): Promise<void> {
        await Logger.log(`Clearing report ${reportId} by moderator ${moderatorId}`);
        
        try {

            const activeReport = await this.db.get<Report>('moderation', 'reports', { id: reportId });
            if (!activeReport) {
                throw new Error(`Report with ID ${reportId} not found`);
            }

            const reportsToClear = await this.findActioningReports(activeReport.offender_id);

            for(const report of reportsToClear) {
                // Update the report status to cleared
                const res = await this.db.update(
                    'moderation',
                    'reports',
                    {
                        status: ReportStatus.CLEARED,
                        moderator_id: moderatorId
                    },
                    { id: report.id }
                );
                if(res.changedRows == 0) {
                    Logger.error("Unexpectedly failed to clear report")
                    throw new Error("Unexpectedly failed to clear Report");
                }

                const updatedReport = await this.db.get<Report>('moderation', 'reports', { id: report.id });
                if (!updatedReport) {
                    throw new Error(`Report with ID ${report.id} not found after update`);
                }
                await Logger.updateReportLog(updatedReport);
            }

            Logger.debug(`Report ${reportId} cleared successfully`);
        } catch (error) {
            Logger.error(`Failed to clear report ${reportId}: ${error}`);
            throw error;
        }
    }

    /**
     * Mark a report as actioning (indicates that action is being taken)
     * @param reportId - ID of the report to mark as actioning
     * @param moderatorId - ID of the moderator marking the report
     * @returns Updated report object
     */
    async actioningReport(reportId: number, moderatorId: string): Promise<Report> {
        await Logger.log(`Marking report ${reportId} as actioning by moderator ${moderatorId}`);
        
        try {
            // Update the report status to actioning
            const res = await this.db.update(
                'moderation',
                'reports',
                {
                    status: ReportStatus.ACTIONING,
                    moderator_id: moderatorId
                },
                { id: reportId }
            );
            if(res.changedRows == 0) {
                Logger.error("Unexpectedly failed to mark report as actioning")
                throw new Error("Unexpectedly failed to mark report as actioning");
            }

            const report = await this.db.get<Report>('moderation', 'reports', { id: reportId });

            if (!report) {
                throw new Error(`Report with ID ${reportId} not found after update`);
            }

            Logger.debug(`Report ${reportId} marked as actioning successfully`);
            return report;

        } catch (error) {
            Logger.error(`Failed to mark report ${reportId} as actioning: ${error}`);
            throw error;
        }
    }

    /**
     * Find all open (PENDING or ACTIONING) reports for a given offender
     * @param offenderId - ID of the offender (question ID, user ID, or server ID)
     * @returns Array of reports
     */
    async findActioningReports(offenderId: string): Promise<Report[]> {
        return await this.db.query<Report>(
            `SELECT * FROM "moderation"."reports" WHERE offender_id = $1 AND status IN ($2, $3)`,
            [offenderId, ReportStatus.PENDING, ReportStatus.ACTIONING]
        );
    }

    /**
     * Get a report by ID
     * @param reportId - ID of the report
     * @returns The report, or null if not found
     */
    async getReport(reportId: number): Promise<Report | null> {
        return await this.db.get<Report>('moderation', 'reports', { id: reportId });
    }

    /**
     * Mark a report as actioned
     * @param reportId - ID of the report
     * @param moderatorId - ID of the moderator
     */
    async actionedReport(reportId: number, moderatorId: string): Promise<void> {
        await Logger.log(`Marking report ${reportId} as actioned by moderator ${moderatorId}`);
        
        try {
            const activeReport = await this.db.get<Report>('moderation', 'reports', { id: reportId });
            if (!activeReport) {
                throw new Error(`Report with ID ${reportId} not found`);
            }

            const reportsToAction = await this.findActioningReports(activeReport.offender_id);

            for (const report of reportsToAction) {
                // Update the report status to actioned
                const res = await this.db.update(
                    'moderation',
                    'reports',
                    {
                        status: ReportStatus.ACTIONED,
                        moderator_id: moderatorId
                    },
                    { id: report.id }
                    
                );

                if (res.changedRows == 0) {
                    Logger.error('Unexpectedly failed to mark report as actioned');
                    throw new Error('Unexpectedly failed to mark report as actioned');
                }

                const updatedReport = await this.db.get<Report>('moderation', 'reports', { id: report.id });
                if (!updatedReport) {
                    throw new Error(`Report with ID ${report.id} not found after update`);
                }
                await Logger.updateReportLog(updatedReport);
            }

            Logger.debug(`Report ${reportId} marked as actioned successfully`);
        } catch (error) {
            Logger.error(`Failed to mark report ${reportId} as actioned: ${error}`);
            throw error;
        }
    }

    /**
     * Reset a report back to pending (e.g. when action dropdown times out)
     * @param reportId - ID of the report to reset
     * @returns Updated report object
     */
    async resetReport(reportId: number): Promise<Report> {
        Logger.debug(`Resetting report ${reportId} to pending`);

        await this.db.update(
            'moderation',
            'reports',
            { status: ReportStatus.PENDING, moderator_id: null },
            { id: reportId }
        );

        const report = await this.db.get<Report>('moderation', 'reports', { id: reportId });
        if (!report) throw new Error(`Report with ID ${reportId} not found after reset`);

        return report;
    }
}