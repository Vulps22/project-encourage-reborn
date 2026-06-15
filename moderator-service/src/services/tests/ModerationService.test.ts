import { ModerationService } from '../ModerationService';
import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { Question, Report, ReportStatus, QuestionType, TargetType } from '@vulps22/project-encourage-types';
import { Logger, ModerationLogger } from '../../bot/utils';

const mockConfig = {
  TRUTHS_LOG_CHANNEL_ID: '123456789',
  DARES_LOG_CHANNEL_ID: '987654321',
  LOG_CHANNEL_ID: '555555555',
  OFFICIAL_GUILD_ID: '999999999'
};

jest.mock('../../bot/utils', () => ({
  Logger: {
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  ModerationLogger: {
    logQuestion: jest.fn().mockResolvedValue({ id: 'msg-123' }),
    updateReportLog: jest.fn().mockResolvedValue(null),
  }
}));

jest.mock('../../bot/services/DatabaseClient');

describe('ModerationService', () => {
  let moderationService: ModerationService;
  let mockDb: jest.Mocked<DatabaseClient>;
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
    originalGlobal = { config: (global as any).config };
  });

  afterAll(() => {
    (global as any).config = originalGlobal.config;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).config = mockConfig;
    (ModerationLogger.logQuestion as jest.Mock).mockResolvedValue({ id: 'msg-123' });

    mockDb = {
      approveQuestion: jest.fn(),
      banQuestion: jest.fn(),
      banServer: jest.fn(),
      getReport: jest.fn(),
      listReports: jest.fn(),
      updateReport: jest.fn(),
    } as any;

    moderationService = new ModerationService(mockDb);
  });

  describe('sendToApprovalQueue', () => {
    it('should send truth question to truths log channel', async () => {
      const result = await moderationService.sendToApprovalQueue(mockQuestion);

      expect(ModerationLogger.logQuestion).toHaveBeenCalledWith(mockQuestion, '123456789');
      expect(Logger.debug).toHaveBeenCalledWith('Sending question 1 to approval queue');
      expect(Logger.debug).toHaveBeenCalledWith('Question 1 would be sent to approval queue in channel 123456789');
      expect(result).toBe('msg-123');
    });

    it('should send dare question to dares log channel', async () => {
      const dareQuestion = { ...mockQuestion, type: 'dare' as QuestionType };

      const result = await moderationService.sendToApprovalQueue(dareQuestion);

      expect(ModerationLogger.logQuestion).toHaveBeenCalledWith(dareQuestion, '987654321');
      expect(result).toBe('msg-123');
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
      mockDb.approveQuestion.mockResolvedValue({ id: 1 } as any);

      await moderationService.approveQuestion('1', '123456789012345678');

      expect(mockDb.approveQuestion).toHaveBeenCalledWith(1, '123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('Approving question 1 by moderator 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('Question 1 approved successfully');
    });

    it('should throw error if question not found (DS returned null)', async () => {
      mockDb.approveQuestion.mockResolvedValue(null);

      await expect(moderationService.approveQuestion('999', '123456789012345678'))
        .rejects.toThrow('Question with ID 999 not found');
    });

    it('should handle DS errors', async () => {
      mockDb.approveQuestion.mockRejectedValue(new Error('DS connection failed'));

      await expect(moderationService.approveQuestion('1', '123456789012345678'))
        .rejects.toThrow('DS connection failed');

      expect(Logger.debug).toHaveBeenCalledWith('Failed to approve question 1: Error: DS connection failed');
    });
  });

  describe('banQuestion', () => {
    it('should successfully ban a question', async () => {
      mockDb.banQuestion.mockResolvedValue({ id: 1 } as any);

      await moderationService.banQuestion('1', '123456789012345678', 'Inappropriate content');

      expect(mockDb.banQuestion).toHaveBeenCalledWith(1, '123456789012345678', 'Inappropriate content');
      expect(Logger.debug).toHaveBeenCalledWith('Banning question 1 by moderator 123456789012345678 with reason: Inappropriate content');
      expect(Logger.debug).toHaveBeenCalledWith('Question 1 banned successfully');
    });

    it('should throw error if question not found', async () => {
      mockDb.banQuestion.mockResolvedValue(null);

      await expect(moderationService.banQuestion('999', '123456789012345678', 'Test reason'))
        .rejects.toThrow('Question with ID 999 not found');
    });

    it('should handle DS errors', async () => {
      mockDb.banQuestion.mockRejectedValue(new Error('DS connection failed'));

      await expect(moderationService.banQuestion('1', '123456789012345678', 'Test reason'))
        .rejects.toThrow('DS connection failed');

      expect(Logger.debug).toHaveBeenCalledWith('Failed to ban question 1: Error: DS connection failed');
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
      mockDb.banServer.mockResolvedValue({ id: '123456789012345678' } as any);

      await moderationService.banServer('123456789012345678', '987654321012345678', 'Spam');

      expect(mockDb.banServer).toHaveBeenCalledWith('123456789012345678', '987654321012345678', 'Spam');
      expect(Logger.debug).toHaveBeenCalledWith('Server 123456789012345678 banned successfully');
    });

    it('should throw if server not found', async () => {
      mockDb.banServer.mockResolvedValue(null);

      await expect(moderationService.banServer('999', '123', 'reason'))
        .rejects.toThrow('Server with ID 999 not found');
    });
  });

  describe('getReport', () => {
    const mockReport = { id: 1, offender_id: '42', status: ReportStatus.PENDING } as Report;

    it('should return report by ID', async () => {
      mockDb.getReport.mockResolvedValue(mockReport);

      const result = await moderationService.getReport(1);

      expect(mockDb.getReport).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReport);
    });

    it('should return null if not found', async () => {
      mockDb.getReport.mockResolvedValue(null);

      const result = await moderationService.getReport(999);

      expect(result).toBeNull();
    });
  });

  describe('findActioningReports', () => {
    it('should return pending and actioning reports for an offender', async () => {
      const mockReports = [{ id: 1 }, { id: 2 }] as Report[];
      mockDb.listReports.mockResolvedValue(mockReports);

      const result = await moderationService.findActioningReports('42');

      expect(mockDb.listReports).toHaveBeenCalledWith('42', [ReportStatus.PENDING, ReportStatus.ACTIONING]);
      expect(result).toEqual(mockReports);
    });

    it('should return empty array when no open reports exist', async () => {
      mockDb.listReports.mockResolvedValue([]);

      const result = await moderationService.findActioningReports('99');

      expect(result).toEqual([]);
    });
  });

  describe('actioningReport', () => {
    const mockReport = { id: 1, offender_id: '42', status: ReportStatus.ACTIONING } as Report;

    it('should mark report as actioning and return updated report', async () => {
      mockDb.updateReport.mockResolvedValue(mockReport);

      const result = await moderationService.actioningReport(1, '123456789012345678');

      expect(mockDb.updateReport).toHaveBeenCalledWith(1, {
        status: ReportStatus.ACTIONING,
        moderator_id: '123456789012345678',
      });
      expect(result).toEqual(mockReport);
      expect(Logger.debug).toHaveBeenCalledWith('Report 1 marked as actioning successfully');
    });

    it('should throw if report not found (DS returned null)', async () => {
      mockDb.updateReport.mockResolvedValue(null);

      await expect(moderationService.actioningReport(999, '123456789012345678'))
        .rejects.toThrow('Report with ID 999 not found');
    });
  });

  describe('actionedReport', () => {
    const mockActiveReport = { id: 1, offender_id: '42', status: ReportStatus.ACTIONING } as Report;
    const mockActionedReport = { ...mockActiveReport, status: ReportStatus.ACTIONED } as Report;

    it('should action all related reports and update their logs', async () => {
      const relatedReports = [{ id: 1 }, { id: 2 }] as Report[];
      mockDb.getReport.mockResolvedValue(mockActiveReport);
      mockDb.listReports.mockResolvedValue(relatedReports);
      mockDb.updateReport.mockResolvedValue(mockActionedReport);

      await moderationService.actionedReport(1, '123456789012345678');

      expect(mockDb.updateReport).toHaveBeenCalledTimes(2);
      expect(ModerationLogger.updateReportLog).toHaveBeenCalledTimes(2);
      expect(Logger.debug).toHaveBeenCalledWith('Report 1 marked as actioned successfully');
    });

    it('should throw if initial report not found', async () => {
      mockDb.getReport.mockResolvedValue(null);

      await expect(moderationService.actionedReport(999, '123456789012345678'))
        .rejects.toThrow('Report with ID 999 not found');
    });

    it('should throw if update returns null', async () => {
      mockDb.getReport.mockResolvedValue(mockActiveReport);
      mockDb.listReports.mockResolvedValue([mockActiveReport]);
      mockDb.updateReport.mockResolvedValue(null);

      await expect(moderationService.actionedReport(1, '123456789012345678'))
        .rejects.toThrow('Unexpectedly failed to mark report as actioned');

      expect(Logger.error).toHaveBeenCalledWith('Unexpectedly failed to mark report as actioned');
    });

    it('should succeed with no updates when no related reports found', async () => {
      mockDb.getReport.mockResolvedValue(mockActiveReport);
      mockDb.listReports.mockResolvedValue([]);

      await moderationService.actionedReport(1, '123456789012345678');

      expect(mockDb.updateReport).not.toHaveBeenCalled();
      expect(ModerationLogger.updateReportLog).not.toHaveBeenCalled();
    });
  });

  describe('clearReport', () => {
    const mockActiveReport = { id: 1, offender_id: '42', status: ReportStatus.PENDING } as Report;
    const mockClearedReport = { ...mockActiveReport, status: ReportStatus.CLEARED } as Report;

    it('should clear all related reports and update their logs', async () => {
      const relatedReports = [{ id: 1 }, { id: 2 }] as Report[];
      mockDb.getReport.mockResolvedValue(mockActiveReport);
      mockDb.listReports.mockResolvedValue(relatedReports);
      mockDb.updateReport.mockResolvedValue(mockClearedReport);

      await moderationService.clearReport(1, '123456789012345678');

      expect(mockDb.updateReport).toHaveBeenCalledTimes(2);
      expect(ModerationLogger.updateReportLog).toHaveBeenCalledTimes(2);
      expect(Logger.debug).toHaveBeenCalledWith('Report 1 cleared successfully');
    });

    it('should throw if report not found', async () => {
      mockDb.getReport.mockResolvedValue(null);

      await expect(moderationService.clearReport(999, '123456789012345678'))
        .rejects.toThrow('Report with ID 999 not found');
    });

    it('should throw and log error if update returns null', async () => {
      mockDb.getReport.mockResolvedValue(mockActiveReport);
      mockDb.listReports.mockResolvedValue([mockActiveReport]);
      mockDb.updateReport.mockResolvedValue(null);

      await expect(moderationService.clearReport(1, '123456789012345678'))
        .rejects.toThrow('Unexpectedly failed to clear Report');

      expect(Logger.error).toHaveBeenCalledWith('Unexpectedly failed to clear report');
    });
  });

  describe('resetReport', () => {
    const mockResetReport = { id: 1, status: ReportStatus.PENDING, moderator_id: null } as Report;

    it('should reset report to pending and return it', async () => {
      mockDb.updateReport.mockResolvedValue(mockResetReport);

      const result = await moderationService.resetReport(1);

      expect(mockDb.updateReport).toHaveBeenCalledWith(1, {
        status: ReportStatus.PENDING,
        moderator_id: null,
      });
      expect(result).toEqual(mockResetReport);
    });

    it('should throw if report not found after reset', async () => {
      mockDb.updateReport.mockResolvedValue(null);

      await expect(moderationService.resetReport(999))
        .rejects.toThrow('Report with ID 999 not found after reset');
    });
  });
});
