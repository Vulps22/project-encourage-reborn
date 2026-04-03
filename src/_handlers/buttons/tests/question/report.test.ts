import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '../../../../structures';
import reportButton from '../../question/report';
import { db, reportService } from '../../../../services';
import { TargetType } from '../../../../types';

jest.mock('../../../../services');

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
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        (reportService.createReport as jest.Mock).mockResolvedValue({ id: 1 });
    });

    it('should have correct name and params', () => {
        expect(reportButton.name).toBe('report');
        expect(reportButton.params).toEqual({ id: 'id' });
    });

    it('should submit report and confirm to user', async () => {
        (db.get as jest.Mock).mockResolvedValue({ id: 42, question: 'Test question?' });

        await reportButton.execute(botInteraction);

        expect(db.get).toHaveBeenCalledWith('question', 'questions', { id: 42 });
        expect(reportService.createReport).toHaveBeenCalledWith(
            '111222333',
            '42',
            'Test question?',
            TargetType.Question,
            '987654321'
        );
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: '✅ Report submitted successfully.' })
        );
    });

    it('should handle missing question ID', async () => {
        mockInteraction.customId = 'question_report';
        botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, 'exec-123');

        await expect(reportButton.execute(botInteraction)).rejects.toThrow(
            'Invalid question ID when using Button: question_report'
        );
        expect(reportService.createReport).not.toHaveBeenCalled();
    });

    it('should handle question not found', async () => {
        (db.get as jest.Mock).mockResolvedValue(null);

        await reportButton.execute(botInteraction);

        expect(reportService.createReport).not.toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: '❌ Question not found.' })
        );
    });
});
