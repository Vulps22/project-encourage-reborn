import { ReportService } from '../ReportService';
import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { Logger, ModerationLogger } from '../../bot/utils';
import { ReportStatus, TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../bot/utils', () => ({
  Logger: {
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  ModerationLogger: {
    logReport: jest.fn(),
  }
}));

jest.mock('../../bot/services/DatabaseClient');

describe('ReportService', () => {
  let reportService: ReportService;
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      createReport: jest.fn(),
      updateReport: jest.fn(),
    } as any;

    reportService = new ReportService(mockDb);
  });

  describe('createReport', () => {
    it('should create report via DS and log it', async () => {
      const mockReport = {
        id: 1,
        type: TargetType.Question,
        reason: 'Inappropriate content',
        status: ReportStatus.PENDING,
        sender_id: '111222333',
        offender_id: '42',
        server_id: '987654321',
        moderator_id: null,
        ban_reason: null,
        content: null,
        message_id: null,
      };
      mockDb.createReport.mockResolvedValue(mockReport as any);
      (ModerationLogger.logReport as jest.Mock).mockResolvedValue(undefined);

      const result = await reportService.createReport(
        '111222333',
        '42',
        null,
        TargetType.Question,
        '987654321',
        'Inappropriate content'
      );

      expect(mockDb.createReport).toHaveBeenCalledWith({
        type: TargetType.Question,
        reason: 'Inappropriate content',
        content: null,
        sender_id: '111222333',
        offender_id: '42',
        server_id: '987654321',
        moderator_id: null,
        ban_reason: null,
      });
      expect(ModerationLogger.logReport).toHaveBeenCalledWith(mockReport);
      expect(result).toEqual(mockReport);
    });

    it('should update message_id when logReport returns a message', async () => {
      const mockReport = {
        id: 1,
        type: TargetType.Question,
        reason: 'Test',
        status: ReportStatus.PENDING,
        sender_id: '111',
        offender_id: '42',
        server_id: '999',
        moderator_id: null,
        ban_reason: null,
        content: null,
        message_id: null,
      };
      const updatedReport = { ...mockReport, message_id: 'msg-abc' };
      mockDb.createReport.mockResolvedValue(mockReport as any);
      mockDb.updateReport.mockResolvedValue(updatedReport as any);
      (ModerationLogger.logReport as jest.Mock).mockResolvedValue({ id: 'msg-abc' });

      const result = await reportService.createReport('111', '42', null, TargetType.Question, '999', 'Test');

      expect(mockDb.updateReport).toHaveBeenCalledWith(1, { message_id: 'msg-abc' });
      expect(result.message_id).toBe('msg-abc');
    });

    it('should default reason to "No reason provided"', async () => {
      const mockReport = { id: 2, reason: 'No reason provided', message_id: null };
      mockDb.createReport.mockResolvedValue(mockReport as any);
      (ModerationLogger.logReport as jest.Mock).mockResolvedValue(undefined);

      await reportService.createReport('111', '42', null, TargetType.Question, '999');

      expect(mockDb.createReport).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'No reason provided' })
      );
    });
  });

  describe('notifyReporter', () => {
    beforeEach(() => {
      (global as any).client = {
        users: { fetch: jest.fn() }
      };
    });

    it('should send a DM to the reporter', async () => {
      const mockSend = jest.fn().mockResolvedValue(undefined);
      (global as any).client.users.fetch.mockResolvedValue({ send: mockSend });

      const mockReport = { id: 1, sender_id: '111222333' };
      await reportService.notifyReporter(mockReport as any, 'Your report has been reviewed.');

      expect((global as any).client.users.fetch).toHaveBeenCalledWith('111222333');
      expect(mockSend).toHaveBeenCalledWith('Your report has been reviewed.');
      expect(Logger.debug).toHaveBeenCalledWith('Notified reporter 111222333 for report 1');
    });

    it('should fail silently if user cannot be notified', async () => {
      (global as any).client.users.fetch.mockRejectedValue(new Error('Cannot send messages to this user'));

      const mockReport = { id: 1, sender_id: '111222333' };
      await expect(
        reportService.notifyReporter(mockReport as any, 'Your report has been reviewed.')
      ).resolves.not.toThrow();

      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Could not notify reporter 111222333 for report 1')
      );
    });
  });
});
