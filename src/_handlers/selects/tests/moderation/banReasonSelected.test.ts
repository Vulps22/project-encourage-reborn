import banReasonSelected from '../../moderation/banReasonSelected';
import { BotSelectMenuInteraction } from '../../../../structures';
import { moderationService, questionService } from '../../../../services';
import { Logger } from '../../../../utils';

// Mock the services and Logger
jest.mock('../../../../services', () => ({
    moderationService: {
        banQuestion: jest.fn()
    },
    questionService: {
        getQuestionById: jest.fn()
    }
}));

jest.mock('../../../../utils', () => ({
    Logger: {
        updateQuestionLog: jest.fn(),
        error: jest.fn()
    }
}));

const mockModerationService = moderationService as jest.Mocked<typeof moderationService>;
const mockQuestionService = questionService as jest.Mocked<typeof questionService>;
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('banReasonSelected select menu handler', () => {
    let mockSelectInteraction: jest.Mocked<BotSelectMenuInteraction>;
    let originalConsoleError: any;

    beforeAll(() => {
        // Mock console.error to avoid test output pollution
        originalConsoleError = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock BotSelectMenuInteraction
        mockSelectInteraction = {
            user: {
                id: '123456789012345678'
            },
            channel: {
                id: 'channel-123'
            },
            message: {
                id: 'message-456'
            },
            values: ['Inappropriate content'],
            params: new Map([['id', '123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            sendReply: jest.fn().mockResolvedValue(undefined)
        } as any;

        // Set up params.get to return proper values
        mockSelectInteraction.params.get = jest.fn().mockReturnValue('123');
    });

    it('should ban question successfully with selected reason', async () => {
        const mockQuestion = { id: 123, message_id: 'msg-789' };
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'Inappropriate content');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'channel-123');
        expect(mockSelectInteraction.sendReply).toHaveBeenCalledWith('✅ Question banned successfully!');
        expect(mockSelectInteraction.ephemeralReply).not.toHaveBeenCalledWith(expect.stringMatching(/❌/));
    });

    it('should handle missing question ID parameter', async () => {
        mockSelectInteraction.params.get = jest.fn().mockReturnValue(undefined);

        await banReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).not.toHaveBeenCalled();
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Invalid question ID');
        expect(mockLogger.error).toHaveBeenCalledWith('Question ID not found when executing banReasonSelected');
    });

    it('should handle missing selected reason', async () => {
        // Create a new mock with empty values
        const mockInteractionEmptyValues = {
            ...mockSelectInteraction,
            values: []
        };

        await banReasonSelected.execute(mockInteractionEmptyValues as any);

        expect(mockModerationService.banQuestion).not.toHaveBeenCalled();
        expect(mockInteractionEmptyValues.ephemeralReply).toHaveBeenCalledWith('❌ No reason selected');
    });

    it('should handle moderation service errors', async () => {
        const testError = new Error('Question not found');
        mockModerationService.banQuestion.mockRejectedValue(testError);

        await banReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'Inappropriate content');
        expect(console.error).toHaveBeenCalledWith('Error banning question:', testError);
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Failed to ban question. Please try again.');
        expect(mockSelectInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should handle null interaction channel', async () => {
        const mockInteractionNoChannel = {
            ...mockSelectInteraction,
            channel: null
        };
        mockModerationService.banQuestion.mockResolvedValue(undefined);

        await banReasonSelected.execute(mockInteractionNoChannel as any);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'Inappropriate content');
        expect(console.error).toHaveBeenCalledWith('Error banning question:', expect.any(Error));
        expect(mockInteractionNoChannel.ephemeralReply).toHaveBeenCalledWith('❌ Failed to ban question. Please try again.');
    });

    it('should handle question not found after banning', async () => {
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(null);

        await banReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'Inappropriate content');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockLogger.error).toHaveBeenCalledWith('Question with ID 123 not found during banning for message message-456');
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Question not found');
        expect(mockSelectInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should use correct moderator ID from interaction', async () => {
        mockSelectInteraction.user.id = '999888777666555444';
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue({ id: 123 } as any);
        mockLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '999888777666555444', 'Inappropriate content');
    });

    it('should handle different question IDs and reasons', async () => {
        const mockQuestion = { id: 999, message_id: 'msg-999' };
        // Create new mock with different values
        const mockInteractionCustom = {
            ...mockSelectInteraction,
            values: ['Custom reason']
        };
        mockInteractionCustom.params.get = jest.fn().mockReturnValue('999');
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banReasonSelected.execute(mockInteractionCustom as any);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('999', '123456789012345678', 'Custom reason');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(999);
        expect(mockLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'channel-123');
    });

    it('should handle database errors gracefully', async () => {
        const testError = new Error('Database connection failed');
        mockModerationService.banQuestion.mockRejectedValue(testError);

        await banReasonSelected.execute(mockSelectInteraction);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'Inappropriate content');
        expect(console.error).toHaveBeenCalledWith('Error banning question:', testError);
        expect(mockSelectInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Failed to ban question. Please try again.');
    });

    it('should have correct select menu handler structure', () => {
        expect(banReasonSelected.name).toBe('banReasonSelected');
        expect(typeof banReasonSelected.execute).toBe('function');
    });

    it('should use first value from values array', async () => {
        // Create new mock with multiple values
        const mockInteractionMultiValues = {
            ...mockSelectInteraction,
            values: ['First reason', 'Second reason']
        };
        mockModerationService.banQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue({ id: 123 } as any);
        mockLogger.updateQuestionLog.mockResolvedValue({} as any);

        await banReasonSelected.execute(mockInteractionMultiValues as any);

        expect(mockModerationService.banQuestion).toHaveBeenCalledWith('123', '123456789012345678', 'First reason');
    });
});