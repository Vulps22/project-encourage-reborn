import { DatabaseService } from './DatabaseService';
import { Question, Report, ReportStatus } from '../interface';
import { Logger } from '../utils';
import { QuestionType, TargetType } from '../types';
import { Message, Snowflake } from 'discord.js';
import { banReasons } from '../config';
import { db } from '.';

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
                    banned_by: moderatorId,
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

    /**
     * Get ban reasons for a specific target type
     * @param type - The type of target (User, Server, Question)
     * @returns Array of ban reason options
     */
    getBanReasons(type: TargetType): {}[]{
        return banReasons[type];
    }

    /**
     * Clear a report (mark as resolved without action)
     * @param reportId - ID of the report to clear
     * @param moderatorId - ID of the moderator clearing the report
     * @returns Updated report object
     */
    async clearReport(reportId: number, moderatorId: string): Promise<Report> {
        Logger.log(`Clearing report ${reportId} by moderator ${moderatorId}`);
        
        try {
            // Update the report status to cleared
            const res = await this.db.update(
                'moderation',
                'reports',
                {
                    status: ReportStatus.CLEARED,
                    moderator_id: moderatorId
                },
                { id: reportId }
            );
            console.log(res)
            if(res.changedRows == 0) {
                Logger.error("Unexpectedly failed to clear report")
                throw new Error("Unexpectedly failed to clear Report");
            }

            const report = await db.get<Report>('moderation', 'reports', { id: reportId });

            if (!report) {
                throw new Error(`Report with ID ${reportId} not found after update`);
            }

            Logger.debug(`Report ${reportId} cleared successfully`);
            return report;
            
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
        Logger.log(`Marking report ${reportId} as actioning by moderator ${moderatorId}`);
        
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
            console.log(res)
            if(res.changedRows == 0) {
                Logger.error("Unexpectedly failed to mark report as actioning")
                throw new Error("Unexpectedly failed to mark report as actioning");
            }

            const report = await db.get<Report>('moderation', 'reports', { id: reportId });

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


}