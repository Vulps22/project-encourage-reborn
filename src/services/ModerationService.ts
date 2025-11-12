//import { DatabaseService } from './DatabaseService';
import { Question } from '../interface';
import { Logger } from '../utils';
import { NotImplementedYet } from '../errors';
import { QuestionType } from '../types';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class ModerationService {
    //constructor(private db: DatabaseService) {}

    /**
     * Send a question to the approval queue for moderation
     * @param question - The question to send for approval
     */
    async sendToApprovalQueue(question: Question): Promise<void> {
        Logger.debug(`Sending question ${question.id} to approval queue`);
        try {
            // Determine which channel to send to based on question type
            const channelId = question.type === QuestionType.Truth
                ? global.config.TRUTHS_LOG_CHANNEL_ID
                : global.config.DARES_LOG_CHANNEL_ID;

            if (!channelId) {
                throw new Error(`No log channel configured for ${question.type} questions`);
            }

            await Logger.logQuestion(question, channelId);
            // For now, just log that it would be sent
            Logger.debug(`Question ${question.id} would be sent to approval queue in channel ${channelId}`);

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
    async approveQuestion(_questionId: string, _moderatorId: string): Promise<void> {
        throw new NotImplementedYet();
    }

    /**
     * Ban a question with a specific reason
     * @param questionId - ID of the question to ban
     * @param moderatorId - ID of the moderator banning
     * @param reason - Reason for banning
     */
    async banQuestion(_questionId: string, _moderatorId: string, _reason: string): Promise<void> {
        throw new NotImplementedYet();
    }

}