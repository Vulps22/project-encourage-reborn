import { ModerationService } from '../ModerationService';
import { DatabaseService, MutationResult } from '../DatabaseService';
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
    let mockDb: jest.Mocked<DatabaseService>;
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

        // Create mock database service
        mockDb = {
            update: jest.fn(),
            get: jest.fn(),
            list: jest.fn(),
            count: jest.fn(),
            insert: jest.fn(),
            delete: jest.fn(),
            query: jest.fn(),
            execute: jest.fn(),
            transaction: jest.fn(),
            testConnection: jest.fn(),
            close: jest.fn()
        } as any;

        moderationService = new ModerationService(mockDb);
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
        it('should successfully approve a question', async () => {
            const mockResult: MutationResult = {
                affectedRows: 1,
                changedRows: 1
            };
            mockDb.update.mockResolvedValue(mockResult);

            await moderationService.approveQuestion('1', '123456789012345678');

            expect(mockDb.update).toHaveBeenCalledWith(
                'core',
                'questions',
                {
                    is_approved: true,
                    approved_by: BigInt('123456789012345678'),
                    datetime_approved: expect.any(Date)
                },
                { id: 1 }
            );
            expect(Logger.debug).toHaveBeenCalledWith('Approving question 1 by moderator 123456789012345678');
            expect(Logger.debug).toHaveBeenCalledWith('Question 1 approved successfully');
        });

        it('should throw error if question not found', async () => {
            const mockResult: MutationResult = {
                affectedRows: 0,
                changedRows: 0
            };
            mockDb.update.mockResolvedValue(mockResult);

            await expect(moderationService.approveQuestion('999', '123456789012345678'))
                .rejects.toThrow('Question with ID 999 not found');
        });

        it('should handle database errors', async () => {
            mockDb.update.mockRejectedValue(new Error('Database connection failed'));

            await expect(moderationService.approveQuestion('1', '123456789012345678'))
                .rejects.toThrow('Database connection failed');

            expect(Logger.debug).toHaveBeenCalledWith('Failed to approve question 1: Error: Database connection failed');
        });
    });

    describe('banQuestion', () => {
        it('should successfully ban a question', async () => {
            const mockResult: MutationResult = {
                affectedRows: 1,
                changedRows: 1
            };
            mockDb.update.mockResolvedValue(mockResult);

            await moderationService.banQuestion('1', '123456789012345678', 'Inappropriate content');

            expect(mockDb.update).toHaveBeenCalledWith(
                'core',
                'questions',
                {
                    is_banned: true,
                    banned_by: '123456789012345678',
                    ban_reason: 'Inappropriate content',
                    datetime_banned: expect.any(Date)
                },
                { id: 1 }
            );
            expect(Logger.debug).toHaveBeenCalledWith('Banning question 1 by moderator 123456789012345678 with reason: Inappropriate content');
            expect(Logger.debug).toHaveBeenCalledWith('Question 1 banned successfully');
        });

        it('should throw error if question not found', async () => {
            const mockResult: MutationResult = {
                affectedRows: 0,
                changedRows: 0
            };
            mockDb.update.mockResolvedValue(mockResult);

            await expect(moderationService.banQuestion('999', '123456789012345678', 'Test reason'))
                .rejects.toThrow('Question with ID 999 not found');
        });

        it('should handle database errors', async () => {
            mockDb.update.mockRejectedValue(new Error('Database connection failed'));

            await expect(moderationService.banQuestion('1', '123456789012345678', 'Test reason'))
                .rejects.toThrow('Database connection failed');

            expect(Logger.debug).toHaveBeenCalledWith('Failed to ban question 1: Error: Database connection failed');
        });
    });
});