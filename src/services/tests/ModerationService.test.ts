import { ModerationService } from '../ModerationService';
import { DatabaseService, MutationResult } from '../DatabaseService';
import { Question, Report, ReportStatus } from '../../interface';
import { QuestionType, TargetType } from '../../types';
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
        error: jest.fn(),
        logTo: jest.fn(),
        logQuestion: jest.fn().mockResolvedValue({ id: 'msg-123' }),
        updateReportLog: jest.fn().mockResolvedValue(null)
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

        // Reset Logger.logQuestion mock to return proper message object
        (Logger.logQuestion as jest.Mock).mockResolvedValue({ id: 'msg-123' });

        // Create mock database service
        mockDb = {
            update: jest.fn(),
            get: jest.fn(),
            list: jest.fn(),
            count: jest.fn(),
            insert: jest.fn(),
            delete: jest.fn(),
            query: jest.fn().mockResolvedValue([]),
            execute: jest.fn(),
            transaction: jest.fn(),
            testConnection: jest.fn(),
            close: jest.fn()
        } as any;

        moderationService = new ModerationService(mockDb);
    });

    describe('sendToApprovalQueue', () => {
        it('should send truth question to truths log channel', async () => {
            const result = await moderationService.sendToApprovalQueue(mockQuestion);

            expect(Logger.logQuestion).toHaveBeenCalledWith(mockQuestion, '123456789');
            expect(Logger.debug).toHaveBeenCalledWith('Sending question 1 to approval queue');
            expect(Logger.debug).toHaveBeenCalledWith('Question 1 would be sent to approval queue in channel 123456789');
            expect(result).toBe('msg-123'); // Should return the message ID
        });

        it('should send dare question to dares log channel', async () => {
            const dareQuestion = { ...mockQuestion, type: 'dare' as QuestionType };
            
            const result = await moderationService.sendToApprovalQueue(dareQuestion);

            expect(Logger.logQuestion).toHaveBeenCalledWith(dareQuestion, '987654321');
            expect(result).toBe('msg-123'); // Should return the message ID
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
                'question',
                'questions',
                {
                    is_approved: true,
                    approved_by: BigInt('123456789012345678'),
                    is_banned: false,
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
                'question',
                'questions',
                {
                    is_banned: true,
                    is_approved: false,
                    banned_by: BigInt('123456789012345678'),
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

    describe('getBanReasons', () => {
        it('should return question ban reasons', () => {
            const result = moderationService.getBanReasons(TargetType.Question);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('label');
            expect(result[0]).toHaveProperty('value');
        });

        it('should return user ban reasons', () => {
            const result = moderationService.getBanReasons(TargetType.User);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should return server ban reasons', () => {
            const result = moderationService.getBanReasons(TargetType.Server);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should return different reasons for different target types', () => {
            const questionReasons = moderationService.getBanReasons(TargetType.Question);
            const userReasons = moderationService.getBanReasons(TargetType.User);
            const serverReasons = moderationService.getBanReasons(TargetType.Server);

            expect(questionReasons).not.toEqual(userReasons);
            expect(questionReasons).not.toEqual(serverReasons);
            expect(userReasons).not.toEqual(serverReasons);
        });
    });

    describe('banServer', () => {
        it('should successfully ban a server', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);

            await moderationService.banServer('123456789012345678', '987654321012345678', 'Spam');

            expect(mockDb.update).toHaveBeenCalledWith(
                'server',
                'servers',
                {
                    can_create: false,
                    is_banned: true,
                    banned_by: '987654321012345678',
                    ban_reason: 'Spam',
                    datetime_banned: expect.any(Date)
                },
                { id: BigInt('123456789012345678') }
            );
            expect(Logger.debug).toHaveBeenCalledWith('Server 123456789012345678 banned successfully');
        });

        it('should throw if server not found', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 0, changedRows: 0 } as MutationResult);

            await expect(moderationService.banServer('999', '123', 'reason'))
                .rejects.toThrow('Server with ID 999 not found');
        });
    });

    describe('getReport', () => {
        const mockReport = { id: 1, offender_id: '42', status: ReportStatus.PENDING } as Report;

        it('should return report by ID', async () => {
            mockDb.get.mockResolvedValue(mockReport);

            const result = await moderationService.getReport(1);

            expect(mockDb.get).toHaveBeenCalledWith('moderation', 'reports', { id: 1 });
            expect(result).toEqual(mockReport);
        });

        it('should return null if not found', async () => {
            mockDb.get.mockResolvedValue(null);

            const result = await moderationService.getReport(999);

            expect(result).toBeNull();
        });
    });

    describe('findActioningReports', () => {
        it('should return pending and actioning reports for an offender', async () => {
            const mockReports = [{ id: 1 }, { id: 2 }] as Report[];
            mockDb.query.mockResolvedValue(mockReports);

            const result = await moderationService.findActioningReports('42');

            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM'),
                ['42', ReportStatus.PENDING, ReportStatus.ACTIONING]
            );
            expect(result).toEqual(mockReports);
        });

        it('should return empty array when no open reports exist', async () => {
            mockDb.query.mockResolvedValue([]);

            const result = await moderationService.findActioningReports('99');

            expect(result).toEqual([]);
        });
    });

    describe('actioningReport', () => {
        const mockReport = { id: 1, offender_id: '42', status: ReportStatus.ACTIONING } as Report;

        it('should mark report as actioning and return updated report', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);
            mockDb.get.mockResolvedValue(mockReport);

            const result = await moderationService.actioningReport(1, '123456789012345678');

            expect(mockDb.update).toHaveBeenCalledWith(
                'moderation',
                'reports',
                { status: ReportStatus.ACTIONING, moderator_id: '123456789012345678' },
                { id: 1 }
            );
            expect(result).toEqual(mockReport);
            expect(Logger.debug).toHaveBeenCalledWith('Report 1 marked as actioning successfully');
        });

        it('should throw if changedRows is 0', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 0 } as MutationResult);

            await expect(moderationService.actioningReport(999, '123456789012345678'))
                .rejects.toThrow('Unexpectedly failed to mark report as actioning');

            expect(Logger.error).toHaveBeenCalledWith('Unexpectedly failed to mark report as actioning');
        });

        it('should throw if report not found after update', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);
            mockDb.get.mockResolvedValue(null);

            await expect(moderationService.actioningReport(1, '123456789012345678'))
                .rejects.toThrow('Report with ID 1 not found after update');
        });
    });

    describe('actionedReport', () => {
        const mockActiveReport = { id: 1, offender_id: '42', status: ReportStatus.ACTIONING } as Report;
        const mockActionedReport = { ...mockActiveReport, status: ReportStatus.ACTIONED } as Report;

        it('should action all related reports and update their logs', async () => {
            const relatedReports = [{ id: 1 }, { id: 2 }] as Report[];
            mockDb.get.mockResolvedValueOnce(mockActiveReport);
            mockDb.query.mockResolvedValueOnce(relatedReports);
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);
            mockDb.get.mockResolvedValue(mockActionedReport);

            await moderationService.actionedReport(1, '123456789012345678');

            expect(mockDb.update).toHaveBeenCalledTimes(2);
            expect(Logger.updateReportLog).toHaveBeenCalledTimes(2);
            expect(Logger.debug).toHaveBeenCalledWith('Report 1 marked as actioned successfully');
        });

        it('should throw if initial report not found', async () => {
            mockDb.get.mockResolvedValueOnce(null);

            await expect(moderationService.actionedReport(999, '123456789012345678'))
                .rejects.toThrow('Report with ID 999 not found');
        });

        it('should throw if update changedRows is 0', async () => {
            mockDb.get.mockResolvedValueOnce(mockActiveReport);
            mockDb.query.mockResolvedValueOnce([mockActiveReport]);
            mockDb.update.mockResolvedValueOnce({ affectedRows: 1, changedRows: 0 } as MutationResult);

            await expect(moderationService.actionedReport(1, '123456789012345678'))
                .rejects.toThrow('Unexpectedly failed to mark report as actioned');

            expect(Logger.error).toHaveBeenCalledWith('Unexpectedly failed to mark report as actioned');
        });

        it('should succeed with no updates when no related reports found', async () => {
            mockDb.get.mockResolvedValueOnce(mockActiveReport);
            mockDb.query.mockResolvedValueOnce([]);

            await moderationService.actionedReport(1, '123456789012345678');

            expect(mockDb.update).not.toHaveBeenCalled();
            expect(Logger.updateReportLog).not.toHaveBeenCalled();
        });
    });

    describe('clearReport', () => {
        const mockActiveReport = { id: 1, offender_id: '42', status: ReportStatus.PENDING } as Report;
        const mockClearedReport = { ...mockActiveReport, status: ReportStatus.CLEARED } as Report;

        it('should clear all related reports and update their logs', async () => {
            const relatedReports = [{ id: 1 }, { id: 2 }] as Report[];
            mockDb.get.mockResolvedValueOnce(mockActiveReport);
            mockDb.query.mockResolvedValueOnce(relatedReports);
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);
            mockDb.get.mockResolvedValue(mockClearedReport);

            await moderationService.clearReport(1, '123456789012345678');

            expect(mockDb.update).toHaveBeenCalledTimes(2);
            expect(Logger.updateReportLog).toHaveBeenCalledTimes(2);
            expect(Logger.debug).toHaveBeenCalledWith('Report 1 cleared successfully');
        });

        it('should throw if report not found', async () => {
            mockDb.get.mockResolvedValueOnce(null);

            await expect(moderationService.clearReport(999, '123456789012345678'))
                .rejects.toThrow('Report with ID 999 not found');
        });

        it('should throw and log error if update fails', async () => {
            mockDb.get.mockResolvedValueOnce(mockActiveReport);
            mockDb.query.mockResolvedValueOnce([mockActiveReport]);
            mockDb.update.mockResolvedValueOnce({ affectedRows: 1, changedRows: 0 } as MutationResult);

            await expect(moderationService.clearReport(1, '123456789012345678'))
                .rejects.toThrow('Unexpectedly failed to clear Report');

            expect(Logger.error).toHaveBeenCalledWith('Unexpectedly failed to clear report');
        });
    });

    describe('resetReport', () => {
        const mockResetReport = { id: 1, status: ReportStatus.PENDING, moderator_id: null } as Report;

        it('should reset report to pending and return it', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);
            mockDb.get.mockResolvedValue(mockResetReport);

            const result = await moderationService.resetReport(1);

            expect(mockDb.update).toHaveBeenCalledWith(
                'moderation',
                'reports',
                { status: ReportStatus.PENDING, moderator_id: null },
                { id: 1 }
            );
            expect(result).toEqual(mockResetReport);
        });

        it('should throw if report not found after reset', async () => {
            mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 } as MutationResult);
            mockDb.get.mockResolvedValue(null);

            await expect(moderationService.resetReport(999))
                .rejects.toThrow('Report with ID 999 not found after reset');
        });
    });
});