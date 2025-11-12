import { ModerationService } from '../ModerationService';
import { Question } from '../../interface';
import { QuestionType } from '../../types';
import { Logger } from '../../utils';

// Mock the global objects
const mockConfig = {
    TRUTHS_LOG_CHANNEL_ID: '123456789',
    DARES_LOG_CHANNEL_ID: '987654321',
    LOG_CHANNEL_ID: '555555555',
    OFFICIAL_GUILD_ID: '999999999'
};

// Mock the Logger
jest.mock('../../utils/Logger', () => ({
    Logger: {
        log: jest.fn(),
        debug: jest.fn(),
        logTo: jest.fn(),
        logQuestion: jest.fn()
    }
}));

describe('ModerationService', () => {
    let moderationService: ModerationService;
    let originalGlobal: any;

    const mockQuestion: Question = {
        id: 1,
        type: 'truth' as QuestionType,
        question: 'Test question?',
        user_id: '123456789',
        is_approved: false,
        approved_by: null,
        datetime_approved: null,
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        datetime_banned: null,
        created: new Date('2024-01-01T00:00:00.000Z'),
        server_id: '987654321',
        message_id: null,
        is_deleted: false,
        datetime_deleted: null
    };

    beforeAll(() => {
        // Save original global state
        originalGlobal = {
            config: (global as any).config
        };
    });

    afterAll(() => {
        // Restore original global state
        (global as any).config = originalGlobal.config;
    });

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Set up global mocks
        (global as any).config = mockConfig;

        moderationService = new ModerationService();
    });

    describe('sendToApprovalQueue', () => {
        it('should send truth question to truths log channel', async () => {
            await moderationService.sendToApprovalQueue(mockQuestion);

            expect(Logger.logQuestion).toHaveBeenCalledWith(mockQuestion, '123456789');
            expect(Logger.debug).toHaveBeenCalledWith('Sending question 1 to approval queue');
            expect(Logger.debug).toHaveBeenCalledWith('Question 1 would be sent to approval queue in channel 123456789');
        });

        it('should send dare question to dares log channel', async () => {
            const dareQuestion = { ...mockQuestion, type: 'dare' as QuestionType };
            
            await moderationService.sendToApprovalQueue(dareQuestion);

            expect(Logger.logQuestion).toHaveBeenCalledWith(dareQuestion, '987654321');
        });

        it('should throw error if no channel configured', async () => {
            (global as any).config = {
                TRUTHS_LOG_CHANNEL_ID: '',
                DARES_LOG_CHANNEL_ID: '987654321'
            };

            await expect(moderationService.sendToApprovalQueue(mockQuestion))
                .rejects.toThrow('No log channel configured for truth questions');
        });
    });

    describe('approveQuestion', () => {
        it('should throw not implemented error', async () => {
            await expect(moderationService.approveQuestion('1', '123456789'))
                .rejects.toThrow('This feature is not yet implemented');
        });
    });

    describe('banQuestion', () => {
        it('should throw not implemented error', async () => {
            await expect(moderationService.banQuestion('1', '123456789', 'Test reason'))
                .rejects.toThrow('This feature is not yet implemented');
        });
    });
});