import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import clearReportButton from '../../moderation/clearReport';
import { moderationService, reportService } from '../../../../services';
import { ReportStatus, TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../../../services');

describe('clearReportButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    const mockReport = {
        id: 1,
        type: TargetType.Question,
        status: ReportStatus.CLEARED,
        reason: 'Test reason',
        sender_id: '111222333',
        offender_id: '42',
        server_id: '987654321',
        moderator_id: '444555666',
        ban_reason: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_clearReport_id:1',
            deferred: false,
            replied: false,
            user: { id: '444555666' },
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            deferUpdate: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        (moderationService.clearReport as jest.Mock).mockResolvedValue(undefined);
        (moderationService.getReport as jest.Mock).mockResolvedValue(mockReport);
        (reportService.notifyReporter as jest.Mock).mockResolvedValue(undefined);
    });

    it('should have correct name and params', () => {
        expect(clearReportButton.name).toBe('clearReport');
        expect(clearReportButton.params).toEqual({ id: 'string' });
    });

    it('should defer update, clear report, and notify reporter', async () => {
        await clearReportButton.execute(botInteraction);

        expect(mockInteraction.deferUpdate).toHaveBeenCalled();
        expect(moderationService.clearReport).toHaveBeenCalledWith(1, '444555666');
        expect(moderationService.getReport).toHaveBeenCalledWith(1);
        expect(reportService.notifyReporter).toHaveBeenCalledWith(
            mockReport,
            `Your report (#1) has been reviewed. No action was taken.`
        );
    });

    it('should handle invalid report ID', async () => {
        mockInteraction.customId = 'moderation_clearReport_id:0';
        botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, 'exec-123');

        await clearReportButton.execute(botInteraction);

        expect(moderationService.clearReport).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Invalid report ID.' })
        );
    });

    it('should send ephemeral follow-up if report not found after clearing', async () => {
        (moderationService.getReport as jest.Mock).mockResolvedValue(null);

        await clearReportButton.execute(botInteraction);

        expect(mockInteraction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Failed to clear report: Report not found after clearing' })
        );
    });

    it('should handle service error with ephemeral follow-up', async () => {
        (moderationService.clearReport as jest.Mock).mockRejectedValue(new Error('DB error'));

        await clearReportButton.execute(botInteraction);

        expect(mockInteraction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Failed to clear report: DB error' })
        );
    });
});
