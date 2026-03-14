import { ReportService } from '../ReportService';
import { Logger } from '../../utils';
import { ReportStatus } from '../../interface';
import { TargetType } from '../../types';

jest.mock('../../utils/Logger');

const mockDb = {
  insert: jest.fn(),
};

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    reportService = new ReportService(mockDb as any);
  });

  describe('createReport', () => {
    it('should insert report and log it', async () => {
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
      };
      mockDb.insert.mockResolvedValue({ rows: [mockReport] });
      (Logger.logReport as jest.Mock).mockResolvedValue(undefined);

      const result = await reportService.createReport(
        '111222333',
        '42',
        TargetType.Question,
        '987654321',
        'Inappropriate content'
      );

      expect(mockDb.insert).toHaveBeenCalledWith('moderation', 'reports', {
        type: TargetType.Question,
        reason: 'Inappropriate content',
        status: ReportStatus.PENDING,
        sender_id: '111222333',
        offender_id: '42',
        server_id: '987654321',
        moderator_id: null,
        ban_reason: null,
      });
      expect(Logger.logReport).toHaveBeenCalledWith(mockReport);
      expect(result).toEqual(mockReport);
    });

    it('should default reason to "No reason provided"', async () => {
      const mockReport = { id: 2, reason: 'No reason provided' };
      mockDb.insert.mockResolvedValue({ rows: [mockReport] });
      (Logger.logReport as jest.Mock).mockResolvedValue(undefined);

      await reportService.createReport('111', '42', TargetType.Question, '999');

      expect(mockDb.insert).toHaveBeenCalledWith(
        'moderation',
        'reports',
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
