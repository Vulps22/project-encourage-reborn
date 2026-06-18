import banQuestionButton from '../../moderation/banQuestion';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { moderationService, questionService } from '../../../../services';
import { ModerationLogger } from '../../../../bot/utils/ModerationLogger';
import { TargetType } from '@vulps22/project-encourage-types';
import { QuestionNotFoundError } from '../../../../bot/errors/QuestionNotFoundError';

// Mock the services and Logger
jest.mock('../../../../services', () => ({
    moderationService: {
        getBanReasons: jest.fn()
    },
    questionService: {
        getQuestionById: jest.fn()
    }
}));

jest.mock('../../../../bot/utils/ModerationLogger', () => ({
    ModerationLogger: {
        updateQuestionLog: jest.fn()
    }
}));

const mockModerationService = moderationService as jest.Mocked<typeof moderationService>;
const mockQuestionService = questionService as jest.Mocked<typeof questionService>;
const mockModerationLogger = ModerationLogger as jest.Mocked<typeof ModerationLogger>;

(global as any).config = {
    TRUTHS_LOG_CHANNEL_ID: 'truths-channel-id',
    DARES_LOG_CHANNEL_ID: 'dares-channel-id',
};

describe('banQuestion button handler', () => {
    let mockButtonInteraction: jest.Mocked<BotButtonInteraction>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock BotButtonInteraction
        mockButtonInteraction = {
            user: {
                id: '123456789012345678'
            },
            channel: {
                id: 'channel-123'
            },
            baseId: 'moderation_banQuestion',
            action: 'banQuestion',
            params: new Map([['id', '123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            message: {
                awaitMessageComponent: jest.fn().mockResolvedValue({}),
            }
        } as any;

        // Set up params.get to return proper values for both calls
        mockButtonInteraction.params.get = jest.fn()
            .mockReturnValueOnce('123') // First call for 'id'
            .mockReturnValueOnce(null); // Second call for 'reason'
    });

    it('should handle missing question ID parameter', async () => {
        // Mock params.get to return undefined
        mockButtonInteraction.params.get = jest.fn().mockReturnValue(undefined);

        await banQuestionButton.execute(mockButtonInteraction);

        expect(mockButtonInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Invalid question ID');
        expect(mockModerationService.getBanReasons).not.toHaveBeenCalled();
        expect(mockQuestionService.getQuestionById).not.toHaveBeenCalled();
    });

    it('should show ban reasons when no reason provided', async () => {
        const mockQuestion = { id: 123, type: 'truth', question: 'Test question?' };
        const mockReasons = [
            { label: '1 - Test Reason', value: 'test_reason' },
            { label: '2 - Another Reason', value: 'another_reason' }
        ];

        // Reset the mock to return proper sequence for this test
        mockButtonInteraction.params.get = jest.fn()
            .mockReturnValueOnce('123') // First call for 'id'
            .mockReturnValueOnce(null); // Second call for 'reason'
        
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockModerationService.getBanReasons.mockReturnValue(mockReasons as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banQuestionButton.execute(mockButtonInteraction);

        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockModerationService.getBanReasons).toHaveBeenCalledWith(TargetType.Question);
        expect(mockModerationLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'truths-channel-id', mockReasons);
        expect(mockButtonInteraction.ephemeralReply).not.toHaveBeenCalled();
    });

    it('should throw QuestionNotFoundError when question does not exist', async () => {
        mockQuestionService.getQuestionById.mockResolvedValue(null);

        await expect(banQuestionButton.execute(mockButtonInteraction))
            .rejects.toThrow(QuestionNotFoundError);

        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockModerationService.getBanReasons).not.toHaveBeenCalled();
        expect(mockModerationLogger.updateQuestionLog).not.toHaveBeenCalled();
    });

    it('should handle different question IDs correctly', async () => {
        const mockQuestion = { id: 999, type: 'dare', question: 'Test dare?' };
        const mockReasons = [{ label: 'Test', value: 'test' }];

        mockButtonInteraction.params.get = jest.fn()
            .mockReturnValueOnce('999') // First call for 'id'
            .mockReturnValueOnce(null); // Second call for 'reason'
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockModerationService.getBanReasons.mockReturnValue(mockReasons as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banQuestionButton.execute(mockButtonInteraction);

        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(999);
        expect(mockModerationLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'dares-channel-id', mockReasons);
    });

    it('should handle when question ID is provided as reason parameter', async () => {
        mockButtonInteraction.params.get = jest.fn()
            .mockReturnValueOnce('123') // id parameter
            .mockReturnValueOnce('spam_reason'); // reason parameter

        // When reason is provided, the function should handle banning logic
        // Since the current implementation only handles showing reasons when no reason provided,
        // this test ensures the function doesn't crash with a reason parameter
        await banQuestionButton.execute(mockButtonInteraction);

        expect(mockButtonInteraction.params.get).toHaveBeenCalledWith('id');
        expect(mockButtonInteraction.params.get).toHaveBeenCalledWith('reason');
    });

    it('should revert question log on 60s timeout', async () => {
        const mockQuestion = { id: 123, type: 'truth', question: 'Test question?' };
        const mockReasons = [{ label: 'Test', value: 'test' }];

        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockModerationService.getBanReasons.mockReturnValue(mockReasons as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);
        mockButtonInteraction.message.awaitMessageComponent = jest.fn().mockRejectedValue(new Error('timeout'));

        await banQuestionButton.execute(mockButtonInteraction);
        await new Promise(resolve => setImmediate(resolve));

        // updateQuestionLog called twice: once with reasons (show dropdown), once without (revert)
        expect(mockModerationLogger.updateQuestionLog).toHaveBeenCalledTimes(2);
        expect(mockModerationLogger.updateQuestionLog).toHaveBeenLastCalledWith(mockQuestion, 'truths-channel-id');
    });

    it('should have correct button handler structure', () => {
        expect(banQuestionButton.name).toBe('banQuestion');
        expect(typeof banQuestionButton.execute).toBe('function');
    });

    it('should use TargetType.Question for ban reasons', async () => {
        const mockQuestion = { id: 123, type: 'truth' };
        const mockReasons = [{ label: 'Test', value: 'test' }];

        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockModerationService.getBanReasons.mockReturnValue(mockReasons as any);
        mockModerationLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.getBanReasons).toHaveBeenCalledWith(TargetType.Question);
    });
});