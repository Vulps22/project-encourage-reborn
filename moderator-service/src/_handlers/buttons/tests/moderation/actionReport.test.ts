import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import actionReportButton from '../../moderation/actionReport';
import { moderationService } from '../../../../services';
import { ModerationLogger } from '../../../../bot/utils/ModerationLogger';
import { ReportStatus, TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../../../services');
jest.mock('../../../../bot/utils/ModerationLogger', () => ({
    ModerationLogger: {
        updateReportLog: jest.fn().mockResolvedValue(null),
    }
}));

describe('actionReportButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    const mockReport = {
        id: 1,
        type: TargetType.Question,
        status: ReportStatus.ACTIONING,
        reason: 'Test reason',
        sender_id: '111222333',
        offender_id: '42',
        server_id: '987654321',
        moderator_id: '444555666',
        ban_reason: null,
    };

    const mockBanReasons = [{ label: 'Inappropriate', value: 'inappropriate' }];

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_takeAction_id:1',
            deferred: false,
            replied: false,
            user: { id: '444555666' },
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            deferUpdate: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
            message: {
                awaitMessageComponent: jest.fn().mockResolvedValue(undefined),
                edit: jest.fn().mockResolvedValue(undefined),
            },
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        (moderationService.actioningReport as jest.Mock).mockResolvedValue(mockReport);
        (moderationService.getBanReasons as jest.Mock).mockReturnValue(mockBanReasons);
        (moderationService.resetReport as jest.Mock).mockResolvedValue({ ...mockReport, status: ReportStatus.PENDING, moderator_id: null });
    });

    it('should have correct name and params', () => {
        expect(actionReportButton.name).toBe('takeAction');
        expect(actionReportButton.params).toEqual({ id: 'string' });
    });

    it('should action report and update report log with ban reasons', async () => {
        await actionReportButton.execute(botInteraction);

        expect(moderationService.actioningReport).toHaveBeenCalledWith(1, '444555666');
        expect(moderationService.getBanReasons).toHaveBeenCalledWith(mockReport.type);
        expect(ModerationLogger.updateReportLog).toHaveBeenCalledWith(mockReport, mockBanReasons);
    });

    it('should handle invalid report ID', async () => {
        mockInteraction.customId = 'moderation_takeAction_id:0';
        botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, 'exec-123');

        await actionReportButton.execute(botInteraction);

        expect(moderationService.actioningReport).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Invalid report ID.' })
        );
    });

    it('should reset report and update report log on 60s timeout', async () => {
        const resetReport = { ...mockReport, status: ReportStatus.PENDING, moderator_id: null };
        (moderationService.resetReport as jest.Mock).mockResolvedValue(resetReport);
        mockInteraction.message.awaitMessageComponent.mockRejectedValue(new Error('timeout'));

        await actionReportButton.execute(botInteraction);

        // Wait for the catch to fire
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(moderationService.resetReport).toHaveBeenCalledWith(1);
        expect(ModerationLogger.updateReportLog).toHaveBeenCalledWith(resetReport);
    });

    it('should handle service error with ephemeral follow-up', async () => {
        (moderationService.actioningReport as jest.Mock).mockRejectedValue(new Error('Report not found'));

        await actionReportButton.execute(botInteraction);

        expect(mockInteraction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Failed to mark report as actioning: Report not found' })
        );
    });
});
