import approveQuestionButton from '../../moderation/approveQuestion';
import { BotButtonInteraction } from '../../../structures';
import { moderationService } from '../../../services';

// Mock the services
jest.mock('../../../services', () => ({
    moderationService: {
        approveQuestion: jest.fn()
    }
}));

const mockModerationService = moderationService as jest.Mocked<typeof moderationService>;

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
            baseId: 'moderation_approveQuestion',
            action: 'approveQuestion',
            params: new Map([['id', '123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            sendReply: jest.fn().mockResolvedValue(undefined)
        } as any;
    });

    it('should approve question successfully', async () => {
        mockModerationService.approveQuestion.mockResolvedValue(undefined);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('123', '123456789012345678');
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
        mockButtonInteraction.params.get = jest.fn().mockReturnValue('999');
        mockModerationService.approveQuestion.mockResolvedValue(undefined);

        await approveQuestionButton.execute(mockButtonInteraction);

        expect(mockModerationService.approveQuestion).toHaveBeenCalledWith('999', '123456789012345678');
    });

    it('should have correct button handler structure', () => {
        expect(approveQuestionButton.name).toBe('approveQuestion');
        expect(typeof approveQuestionButton.execute).toBe('function');
    });
});