import { AnalyticsService } from '../AnalyticsService';
import { dsClient } from '../../client';

jest.mock('@vulps22/logger', () => ({
    Logger: {
        error: jest.fn(),
    },
}));

jest.mock('../../client', () => ({
    dsClient: {
        logAnalyticsEvent: jest.fn(),
    },
}));

const { Logger } = require('@vulps22/logger');

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AnalyticsService();
    });

    describe('logEvent', () => {
        it('does not call DS when isInitiator is false', () => {
            service.logEvent('button', 'acceptTerms', false, 'user-1', 'guild-1');

            expect(dsClient.logAnalyticsEvent).not.toHaveBeenCalled();
        });

        it('calls DS without awaiting when isInitiator is true', () => {
            (dsClient.logAnalyticsEvent as jest.Mock).mockResolvedValue(undefined);

            service.logEvent('command', 'dare', true, 'user-1', 'guild-1');

            expect(dsClient.logAnalyticsEvent).toHaveBeenCalledWith('command', 'dare', 'user-1', 'guild-1');
        });

        it('logs via Logger.error and does not throw when the DS call fails', async () => {
            (dsClient.logAnalyticsEvent as jest.Mock).mockRejectedValue(new Error('DS is down'));

            expect(() => service.logEvent('button', 'done', true, 'user-1', 'guild-1')).not.toThrow();

            // let the rejected promise's .catch() handler run
            await new Promise(process.nextTick);

            expect(Logger.error).toHaveBeenCalledWith('Failed to log analytics event (button:done): DS is down');
        });
    });
});
