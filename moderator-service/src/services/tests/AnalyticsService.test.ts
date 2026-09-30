import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { AnalyticsService } from '../AnalyticsService';

jest.mock('../../bot/services/DatabaseClient');
jest.mock('../../bot/utils', () => ({
  Logger: {
    error: jest.fn(),
  }
}));

const { Logger } = require('../../bot/utils');

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      logAnalyticsEvent: jest.fn(),
    } as any;

    service = new AnalyticsService(mockDb);
  });

  describe('logEvent', () => {
    it('does not call DS when isInitiator is false', () => {
      service.logEvent('button', 'banUser', false, 'user-1', 'guild-1');

      expect(mockDb.logAnalyticsEvent).not.toHaveBeenCalled();
    });

    it('calls DS without awaiting when isInitiator is true', () => {
      mockDb.logAnalyticsEvent.mockResolvedValue(undefined);

      service.logEvent('button', 'approveQuestion', true, 'user-1', 'guild-1');

      expect(mockDb.logAnalyticsEvent).toHaveBeenCalledWith('button', 'approveQuestion', 'user-1', 'guild-1');
    });

    it('logs via Logger.error and does not throw when the DS call fails', async () => {
      mockDb.logAnalyticsEvent.mockRejectedValue(new Error('DS is down'));

      expect(() => service.logEvent('button', 'approveQuestion', true, 'user-1', 'guild-1')).not.toThrow();

      // let the rejected promise's .catch() handler run
      await new Promise(process.nextTick);

      expect(Logger.error).toHaveBeenCalledWith('Failed to log analytics event (button:approveQuestion): DS is down');
    });
  });
});
