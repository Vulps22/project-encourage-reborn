import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '../../../../structures';
import clearReportButton from '../../moderation/clearReport';
import { moderationService } from '../../../../services';
import { ReportView } from '../../../../views/moderation/reportView';
import { ReportStatus } from '../../../../interface';
import { TargetType } from '../../../../types';

jest.mock('../../../../services');
jest.mock('../../../../views/moderation/reportView');

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

        (moderationService.clearReport as jest.Mock).mockResolvedValue(mockReport);
        (ReportView as jest.Mock).mockResolvedValue({ components: [] });
    });

    it('should have correct name and params', () => {
        expect(clearReportButton.name).toBe('clearReport');
        expect(clearReportButton.params).toEqual({ id: 'string' });
    });

    it('should clear report and update component message', async () => {
        await clearReportButton.execute(botInteraction);

        expect(moderationService.clearReport).toHaveBeenCalledWith(1, '444555666');
        expect(ReportView).toHaveBeenCalledWith(mockReport, null);
        expect(mockInteraction.update).toHaveBeenCalled();
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

    it('should handle service error with ephemeral follow-up', async () => {
        (moderationService.clearReport as jest.Mock).mockRejectedValue(new Error('Report not found'));

        await clearReportButton.execute(botInteraction);

        expect(mockInteraction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Failed to clear report: Report not found' })
        );
    });
});
