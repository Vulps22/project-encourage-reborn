import { UserTrackingService } from '../UserTrackingService';
import { dsClient } from '../../client';
import { DMInteractionError } from '../../errors';

jest.mock('../../client', () => ({
    dsClient: {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        trackInteraction: jest.fn(),
    },
}));

const createMockInteraction = (
    userId: string,
    guildId: string | null,
    ownerId: string = '111222333'
) => ({
    user: { id: userId },
    guildId,
    guild: guildId ? { ownerId } : null,
});

describe('UserTrackingService', () => {
    let service: UserTrackingService;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        service = new UserTrackingService();
    });

    afterEach(() => {
        service.stopCleanup();
        jest.useRealTimers();
    });

    describe('trackInteraction', () => {
        it('should throw DMInteractionError when guildId is null', async () => {
            const interaction = createMockInteraction('123456789', null);

            await expect(service.trackInteraction(interaction as any))
                .rejects
                .toThrow(DMInteractionError);

            expect(dsClient.trackInteraction).not.toHaveBeenCalled();
        });

        it('should throw DMInteractionError when guild is null despite guildId existing', async () => {
            const interaction = { user: { id: '123456789' }, guildId: '987654321', guild: null };

            await expect(service.trackInteraction(interaction as any))
                .rejects
                .toThrow(DMInteractionError);

            expect(dsClient.trackInteraction).not.toHaveBeenCalled();
        });

        it('should call trackInteraction with correct ids', async () => {
            const interaction = createMockInteraction('123456789', '987654321', '111222333');
            (dsClient.trackInteraction as jest.Mock).mockResolvedValue(undefined);

            await service.trackInteraction(interaction as any);

            expect(dsClient.trackInteraction).toHaveBeenCalledWith(
                '123456789',
                '987654321',
                '111222333',
            );
        });

        it('should throw when DS returns an error', async () => {
            const interaction = createMockInteraction('123456789', '987654321', '111222333');
            (dsClient.trackInteraction as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

            await expect(service.trackInteraction(interaction as any))
                .rejects
                .toThrow('Database tracking failed: Service unavailable');
        });

        it('should handle unknown error types gracefully', async () => {
            const interaction = createMockInteraction('123456789', '987654321', '111222333');
            (dsClient.trackInteraction as jest.Mock).mockRejectedValue('Unknown error type');

            await expect(service.trackInteraction(interaction as any))
                .rejects
                .toThrow('Database tracking failed: Unknown error');
        });

        it('should cache and skip DS calls for the same user-server within 1 hour', async () => {
            const interaction = createMockInteraction('123456789', '987654321', '111222333');
            (dsClient.trackInteraction as jest.Mock).mockResolvedValue(undefined);

            await service.trackInteraction(interaction as any);
            await service.trackInteraction(interaction as any);
            await service.trackInteraction(interaction as any);

            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(1);
        });

        it('should call DS again after the cache TTL expires', async () => {
            const interaction = createMockInteraction('123456789', '987654321', '111222333');
            (dsClient.trackInteraction as jest.Mock).mockResolvedValue(undefined);

            await service.trackInteraction(interaction as any);
            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(60 * 60 * 1000 + 1);

            await service.trackInteraction(interaction as any);
            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(2);
        });

        it('should track different user-server combinations separately', async () => {
            const i1 = createMockInteraction('123456789', '987654321', '111222333');
            const i2 = createMockInteraction('123456789', '111222333', '444555666');
            const i3 = createMockInteraction('999888777', '987654321', '111222333');
            (dsClient.trackInteraction as jest.Mock).mockResolvedValue(undefined);

            await service.trackInteraction(i1 as any);
            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(1);

            await service.trackInteraction(i2 as any);
            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(2);

            await service.trackInteraction(i3 as any);
            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(3);

            await service.trackInteraction(i1 as any); // cached
            expect(dsClient.trackInteraction).toHaveBeenCalledTimes(3);
        });
    });

    describe('DMInteractionError', () => {
        it('should have correct message and name', () => {
            const error = new DMInteractionError();
            expect(error.message).toBe("I'm sorry, DM interactions are not currently supported");
            expect(error.name).toBe('DMInteractionError');
        });

        it('should be instanceof Error', () => {
            expect(new DMInteractionError()).toBeInstanceOf(Error);
        });
    });
});
