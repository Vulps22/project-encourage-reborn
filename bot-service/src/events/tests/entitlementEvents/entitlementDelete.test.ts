import { Entitlement } from 'discord.js';

jest.mock('@vulps22/logger', () => ({
    Logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../../../services', () => ({
    entitlementService: {
        capture: jest.fn(),
    },
}));

import entitlementDelete from '../../entitlementEvents/entitlementDelete';
import { entitlementService } from '../../../services';
import { Logger } from '@vulps22/logger';

const makeEntitlement = (overrides: Partial<Entitlement> = {}): Entitlement => ({
    id: 'ent-1',
    skuId: 'sku-1',
    userId: 'user-1',
    guildId: 'guild-1',
    ...overrides,
} as Entitlement);

describe('entitlementDelete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('has the correct event name and once flag', () => {
        expect(entitlementDelete.event).toBe('entitlementDelete');
        expect(entitlementDelete.once).toBe(false);
    });

    it('captures the entitlement as a delete event', async () => {
        const entitlement = makeEntitlement();
        (entitlementService.capture as jest.Mock).mockResolvedValue(undefined);

        await entitlementDelete.execute(entitlement);

        expect(entitlementService.capture).toHaveBeenCalledWith(entitlement, 'delete');
    });

    it('logs and swallows errors instead of throwing', async () => {
        const entitlement = makeEntitlement();
        (entitlementService.capture as jest.Mock).mockRejectedValue(new Error('ds down'));

        await expect(entitlementDelete.execute(entitlement)).resolves.not.toThrow();

        expect(Logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to capture entitlementDelete for entitlement ent-1')
        );
    });
});
