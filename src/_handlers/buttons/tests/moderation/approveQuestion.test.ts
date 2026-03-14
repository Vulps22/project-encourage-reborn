import approveQuestionButton from '../../moderation/approveQuestion';
import { BotButtonInteraction } from '../../../../structures';
import { moderationService, questionService } from '../../../../services';
import { Logger } from '../../../../utils';

// Mock the services and Logger
jest.mock('../../../../services', () => ({
    moderationService: {
        approveQuestion: jest.fn()
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

(global as any).config = {
    TRUTHS_LOG_CHANNEL_ID: 'truths-channel-id',
    DARES_LOG_CHANNEL_ID: 'dares-channel-id',
};

describe('approveQuestion button handler', () => {
    let mockButtonInteraction: jest.Mocked<BotButtonInteraction>;
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

        // Create mock BotButtonInteraction
        mockButtonInteraction = {
            user: {
                id: '123456789012345678'
            },
            channel: {
                id: 'channel-123'
            },
            message: {
                id: 'message-456'
            },
            baseId: 'moderation_approveQuestion',
            action: 'approveQuestion',
            params: new Map([['id', '123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            sendReply: jest.fn().mockResolvedValue(undefined)
        } as any;
    });

    it('should approve question successfully', async () => {
        const mockQuestion = { id: 123, message_id: 'msg-789', type: 'truth' };
        mockModerationService.approveQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockLogger.updateQuestionLog.mockResolvedValue({} as any);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('123', '123456789012345678');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'truths-channel-id');
        expect(mockButtonInteraction.sendReply).toHaveBeenCalledWith('✅ Question approved successfully!');
        expect(mockButtonInteraction.ephemeralReply).not.toHaveBeenCalled();
    });

    it('should handle missing question ID parameter', async () => {
        // Mock params.get to return undefined
        mockButtonInteraction.params.get = jest.fn().mockReturnValue(undefined);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).not.toHaveBeenCalled();
        expect(mockButtonInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Invalid question ID');
        expect(mockButtonInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should handle moderation service errors', async () => {
        const testError = new Error('Question not found');
        mockModerationService.approveQuestion.mockRejectedValue(testError);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('123', '123456789012345678');
        expect(console.error).toHaveBeenCalledWith('Error approving question:', testError);
        expect(mockButtonInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Failed to approve question. Please try again.');
        expect(mockButtonInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
        const testError = new Error('Database connection failed');
        mockModerationService.approveQuestion.mockRejectedValue(testError);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('123', '123456789012345678');
        expect(console.error).toHaveBeenCalledWith('Error approving question:', testError);
        expect(mockButtonInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Failed to approve question. Please try again.');
    });

    it('should use correct moderator ID from interaction', async () => {
        mockButtonInteraction.user.id = '999888777666555444';
        mockModerationService.approveQuestion.mockResolvedValue(undefined);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('123', '999888777666555444');
    });

    it('should handle different question IDs', async () => {
        const mockQuestion = { id: 999, message_id: 'msg-999', type: 'dare' };
        mockButtonInteraction.params.get = jest.fn().mockReturnValue('999');
        mockModerationService.approveQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion as any);
        mockLogger.updateQuestionLog.mockResolvedValue({} as any);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('999', '123456789012345678');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(999);
        expect(mockLogger.updateQuestionLog).toHaveBeenCalledWith(mockQuestion, 'dares-channel-id');
    });

    it('should handle question not found after approval', async () => {
        mockModerationService.approveQuestion.mockResolvedValue(undefined);
        mockQuestionService.getQuestionById.mockResolvedValue(null);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('123', '123456789012345678');
        expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(123);
        expect(mockLogger.error).toHaveBeenCalledWith('Question with ID 123 not found during approval for message message-456');
        expect(mockButtonInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Question not found');
        expect(mockButtonInteraction.sendReply).not.toHaveBeenCalled();
    });

    it('should have correct button handler structure', () => {
        expect(approveQuestionButton.name).toBe('approveQuestion');
        expect(typeof approveQuestionButton.execute).toBe('function');
    });
});