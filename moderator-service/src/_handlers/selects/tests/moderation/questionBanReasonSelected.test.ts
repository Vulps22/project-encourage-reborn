import questionBanReasonSelected from '../../moderation/questionBanReasonSelected';
import { BotSelectMenuInteraction } from '@vulps22/bot-interactions';
import { moderationService, questionService } from '../../../../services';
import { Logger, ModerationLogger } from '../../../../bot/utils';

jest.mock('../../../../services', () => ({
    moderationService: {
        banQuestion: jest.fn(),
        findActioningReports: jest.fn().mockResolvedValue([]),
        actionedReport: jest.fn().mockResolvedValue(undefined),
    },
    questionService: {
        getQuestionById: jest.fn()
    },
    reportService: {
        notifyReporter: jest.fn().mockResolvedValue(undefined),
    }
}));

jest.mock('../../../../bot/utils', () => ({
    Logger: {
        error: jest.fn()
    },
    ModerationLogger: {
        updateQuestionLog: jest.fn(),
    }
}));

const mockModerationService = moderationService as jest.Mocked<typeof moderationService>;
const mockQuestionService = questionService as jest.Mocked<typeof questionService>;
const mockLogger = Logger as jest.Mocked<typeof Logger>;
const mockModerationLogger = ModerationLogger as jest.Mocked<typeof ModerationLogger>;

(global as any).config = {
    TRUTHS_LOG_CHANNEL_ID: 'truths-channel-id',
    DARES_LOG_CHANNEL_ID: 'dares-channel-id',
};

describe('questionBanReasonSelected select menu handler', () => {
    let mockSelectInteraction: jest.Mocked<BotSelectMenuInteraction>;
    let originalConsoleError: any;

    beforeAll(() => {
        originalConsoleError = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockModerationService.findActioningReports.mockResolvedValue([]);

        mockSelectInteraction = {
            user: { id: '123456789012345678' },
            channel: { id: 'channel-123' },
            message: { id: 'message-456' },
            values: ['Inappropriate content'],
            params: new Map([['id', '123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            ephemeralFollowUp: jest.fn().mockResolvedValue(undefined),
            deferUpdate: jest.fn().mockResolvedValue(undefined),
            sendReply: jest.fn().mockResolvedValue(undefined),
        } as any;

        mockSelectInteraction.params.get = jest.fn().mockReturnValue('123');
    });

    it('should have correct handler structure', () => {
        expect(questionBanReasonSelected.name).toBe('questionBanReasonSelected');
        expect(typeof questionBanReasonSelected.execute).toBe('function');
    });

    it('should defer update and ban question silently on success', async () => {
        const mockQuestion = { id: 123, message_id: 'msg-789', type: 'truth' };
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);

        await questionBanReasonSelected.execute(mockSelectInteraction);

        expect(mockSelectInteraction.deferUpdate).toHaveBeenCalled();
        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'Inappropriate content');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockModerationLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'truths-channel-id');
        expect(mockSelectInteraction.ephemeralReply).not.toHaveBeenCalled();
        expect(mockSelectInteraction.ephemeralFollowUp).not.toHaveBeenCalled();
    });

    it('should reply ephemerally with error when question ID is missing', async () => {
        mockSelectInteraction.params.get = jest.fn().mockReturnValue(undefined);

        await questionBanReasonSelected.execute(mockSelectInteraction);

        expect(mockSelectInteraction.deferUpdate).not.toHaveBeenCalled();
        expect(mockModerationService.banQuestion).not.toHaveBeenCalled();
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Invalid question ID');
        expect(mockLogger.error).toHaveBeenCalledWith('Question ID not found when executing questionBanReasonSelected');
    });

    it('should reply ephemerally with error when no reason selected', async () => {
        const mockInteractionEmptyValues = { ...mockSelectInteraction, values: [] };

        await questionBanReasonSelected.execute(mockInteractionEmptyValues as any);

        expect(mockSelectInteraction.deferUpdate).not.toHaveBeenCalled();
        expect(mockModerationService.banQuestion).not.toHaveBeenCalled();
        expect(mockInteractionEmptyValues.ephemeralReply).toHaveBeenCalledWith('❌ No reason selected');
    });

    it('should send ephemeral follow-up when question not found after banning', async () => {
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(null);

        await questionBanReasonSelected.execute(mockSelectInteraction);

        expect(mockSelectInteraction.deferUpdate).toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith('Question with ID 123 not found during banning for message message-456');
        expect(mockSelectInteraction.ephemeralFollowUp).toHaveBeenCalledWith('❌ Question not found');
    });

    it('should send ephemeral follow-up on service failure', async () => {
        const testError = new Error('Database connection failed');
        mockModerationService.banQuestion.mockRejectedValue(testError);

        await questionBanReasonSelected.execute(mockSelectInteraction);

        expect(mockSelectInteraction.deferUpdate).toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith(`Error banning question: ${testError}`);
        expect(mockSelectInteraction.ephemeralFollowUp).toHaveBeenCalledWith('❌ Failed to ban question. Please try again.');
    });

    it('should use first value from values array', async () => {
        const mockInteractionMultiValues = { ...mockSelectInteraction, values: ['First reason', 'Second reason'] };
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue({ id: 123 } as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);

        await questionBanReasonSelected.execute(mockInteractionMultiValues as any);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'First reason');
    });

    it('should pass correct moderator ID from interaction user', async () => {
        mockSelectInteraction.user.id = '999888777666555444';
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue({ id: 123 } as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);

        await questionBanReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '999888777666555444', 'Inappropriate content');
    });

    it('should notify all reporters when multiple ACTIONING reports exist', async () => {
        const mockReports = [
            { id: 10, sender_id: 'reporter-1' },
            { id: 11, sender_id: 'reporter-2' },
        ];
        const mockQuestion = { id: 123, message_id: 'msg-789' };
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);
        (mockModerationService as any).findActioningReports.mockResolvedValue(mockReports);

        await questionBanReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.actionedReport).toHaveBeenCalledTimes(2);
        expect(mockModerationService.actionedReport).toHaveBeenCalledWith(10, '123456789012345678');
        expect(mockModerationService.actionedReport).toHaveBeenCalledWith(11, '123456789012345678');
    });
});
