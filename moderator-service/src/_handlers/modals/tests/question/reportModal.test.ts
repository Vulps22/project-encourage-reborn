import { ModalSubmitInteraction } from 'discord.js';
import reportModal from '../../question/reportModal';
import { db, reportService } from '../../../../services';
import { BotModalInteraction } from '@vulps22/bot-interactions';
import { TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../../../services');

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
            fields: {
                getTextInputValue: jest.fn().mockReturnValue('This is an inappropriate question.'),
            },
        };

        botInteraction = new BotModalInteraction(
            mockInteraction as unknown as ModalSubmitInteraction,
            'exec-123'
        );

        (reportService.createReport as jest.Mock).mockResolvedValue({ id: 1 });
    });

    it('should have correct name and params', () => {
        expect(reportModal.name).toBe('reportModal');
        expect(reportModal.params).toEqual({ id: 'id' });
    });

    it('should create a report with the provided reason and confirm to user', async () => {
        (db.getQuestion as jest.Mock).mockResolvedValue({ id: 42, question: 'Test question?' });

        await reportModal.execute(botInteraction);

        expect(db.getQuestion).toHaveBeenCalledWith(42);
        expect(reportService.createReport).toHaveBeenCalledWith(
            '111222333',
            '42',
            'Test question?',
            TargetType.Question,
            '987654321',
            'This is an inappropriate question.'
        );
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: '✅ Report submitted successfully.' })
        );
    });

    it('should handle missing question ID', async () => {
        mockInteraction.customId = 'question_reportModal';
        botInteraction = new BotModalInteraction(mockInteraction as unknown as ModalSubmitInteraction, 'exec-123');

        await expect(reportModal.execute(botInteraction)).rejects.toThrow(
            'Invalid question ID when using Modal: question_reportModal'
        );
        expect(reportService.createReport).not.toHaveBeenCalled();
    });

    it('should handle question not found', async () => {
        (db.getQuestion as jest.Mock).mockResolvedValue(null);

        await reportModal.execute(botInteraction);

        expect(reportService.createReport).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Question not found.' })
        );
    });
});
