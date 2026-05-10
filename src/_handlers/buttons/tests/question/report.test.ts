import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import reportButton from '../../question/report';

describe('reportButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'question_report_id:42',
            deferred: false,
            replied: false,
            guildId: '987654321',
            user: { id: '111222333' },
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            showModal: jest.fn().mockResolvedValue(undefined),
            message: { id: 'msg123' },
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );
    });

    it('should have correct name and params', () => {
        expect(reportButton.name).toBe('report');
        expect(reportButton.params).toEqual({ id: 'id' });
    });

    it('should show the report reason modal', async () => {
        await reportButton.execute(botInteraction);

        expect(mockInteraction.showModal).toHaveBeenCalledTimes(1);
        const modal = mockInteraction.showModal.mock.calls[0][0];
        expect(modal.data.custom_id).toBe('question_reportModal_id:42');
        expect(modal.data.title).toBe('Report Question');
    });

    it('should handle missing question ID', async () => {
        mockInteraction.customId = 'question_report';
        botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, 'exec-123');

        await expect(reportButton.execute(botInteraction)).rejects.toThrow(
            'Invalid question ID when using Button: question_report'
        );
        expect(mockInteraction.showModal).not.toHaveBeenCalled();
    });
});
