import { ConfigurationService } from '../ConfigurationService';
import { dsClient, DSError } from '../../client';
import { CoreConfig } from '../../interface';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

const makeConfig = (overrides: Partial<CoreConfig> = {}): CoreConfig => ({
    id: 'config',
    vote_threshold: 5,
    ...overrides,
});

describe('ConfigurationService', () => {
    let service: ConfigurationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ConfigurationService();
    });

    describe('getConfig', () => {
        it('should fetch config from DS and return it', async () => {
            const config = makeConfig();
            (dsClient.get as jest.Mock).mockResolvedValue(config);

            const result = await service.getConfig();

            expect(dsClient.get).toHaveBeenCalledWith('/config');
            expect(result).toEqual(config);
        });

        it('should return cached value on second call without hitting DS', async () => {
            const config = makeConfig();
            (dsClient.get as jest.Mock).mockResolvedValue(config);

            await service.getConfig();
            await service.getConfig();

            expect(dsClient.get).toHaveBeenCalledTimes(1);
        });

        it('should re-fetch after cache is invalidated', async () => {
            const config = makeConfig();
            (dsClient.get as jest.Mock).mockResolvedValue(config);

            await service.getConfig();
            service.invalidateCache();
            await service.getConfig();

            expect(dsClient.get).toHaveBeenCalledTimes(2);
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(service.getConfig()).rejects.toThrow('Server error');
        });
    });

    describe('getVoteThreshold', () => {
        it('should return the vote_threshold from config', async () => {
            (dsClient.get as jest.Mock).mockResolvedValue(makeConfig({ vote_threshold: 3 }));

            const result = await service.getVoteThreshold();

            expect(result).toBe(3);
        });
    });

    describe('invalidateCache', () => {
        it('should force a re-fetch on next getConfig call', async () => {
            const config = makeConfig();
            (dsClient.get as jest.Mock).mockResolvedValue(config);

            await service.getConfig();
            service.invalidateCache();

            expect(dsClient.get).toHaveBeenCalledTimes(1);

            await service.getConfig();

            expect(dsClient.get).toHaveBeenCalledTimes(2);
        });
    });
});
