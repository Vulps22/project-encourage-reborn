import { ModalSubmitInteraction } from 'discord.js';
import { BotModalInteraction } from '@vulps22/bot-interactions';
import reportModal from '../../question/reportModal';
import { dsClient, msClient } from '../../../../client';
import { TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../../../client', () => ({
    dsClient: { getQuestion: jest.fn() },
    msClient: { submitReport: jest.fn() },
}));

describe('reportModal', () => {
    let mockInteraction: any;
    let botInteraction: BotModalInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'question_reportModal_id:42',
            deferred: false,
            replied: false,
            guildId: '987654321',
            user: { id: '111222333' },
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
            fields: {
                getTextInputValue: jest.fn().mockReturnValue('This is an inappropriate question.'),
            },
        };

        botInteraction = new BotModalInteraction(
            mockInteraction as unknown as ModalSubmitInteraction,
            'exec-123'
        );

        (dsClient.getQuestion as jest.Mock).mockResolvedValue({ id: 42, question: 'Test question?' });
        (msClient.submitReport as jest.Mock).mockResolvedValue(undefined);
    });

    it('should have correct name and params', () => {
        expect(reportModal.name).toBe('reportModal');
        expect(reportModal.interactionInitiator).toBe(false);
        expect(reportModal.params).toEqual({ id: 'id' });
    });

    it('should create a report with the provided reason and confirm to user', async () => {
        await reportModal.execute(botInteraction);

        expect(dsClient.getQuestion).toHaveBeenCalledWith(42);
        expect(msClient.submitReport).toHaveBeenCalledWith(
            '111222333',
            '42',
            TargetType.Question,
            '987654321',
            'Test question?',
            'This is an inappropriate question.'
        );
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should handle missing question ID', async () => {
        mockInteraction.customId = 'question_reportModal';
        botInteraction = new BotModalInteraction(mockInteraction as unknown as ModalSubmitInteraction, 'exec-123');

        await expect(reportModal.execute(botInteraction)).rejects.toThrow(
            'Invalid question ID when using Modal: question_reportModal'
        );
        expect(msClient.submitReport).not.toHaveBeenCalled();
    });

    it('should handle question not found', async () => {
        (dsClient.getQuestion as jest.Mock).mockResolvedValue(null);

        await reportModal.execute(botInteraction);

        expect(msClient.submitReport).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });
});
