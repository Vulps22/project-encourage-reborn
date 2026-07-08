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

import entitlementUpdate from '../../entitlementEvents/entitlementUpdate';
import { entitlementService } from '../../../services';
import { Logger } from '@vulps22/logger';

const makeEntitlement = (overrides: Partial<Entitlement> = {}): Entitlement => ({
    id: 'ent-1',
    skuId: 'sku-1',
    userId: 'user-1',
    guildId: 'guild-1',
    ...overrides,
} as Entitlement);

describe('entitlementUpdate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('has the correct event name and once flag', () => {
        expect(entitlementUpdate.event).toBe('entitlementUpdate');
        expect(entitlementUpdate.once).toBe(false);
    });

    it('captures the new entitlement as an update event, ignoring the old one', async () => {
        const oldEntitlement = makeEntitlement({ consumed: false } as Partial<Entitlement>);
        const newEntitlement = makeEntitlement({ consumed: true } as Partial<Entitlement>);
        (entitlementService.capture as jest.Mock).mockResolvedValue(undefined);

        await entitlementUpdate.execute(oldEntitlement, newEntitlement);

        expect(entitlementService.capture).toHaveBeenCalledWith(newEntitlement, 'update');
        expect(entitlementService.capture).toHaveBeenCalledTimes(1);
    });

    it('handles a null old entitlement', async () => {
        const newEntitlement = makeEntitlement();
        (entitlementService.capture as jest.Mock).mockResolvedValue(undefined);

        await entitlementUpdate.execute(null, newEntitlement);

        expect(entitlementService.capture).toHaveBeenCalledWith(newEntitlement, 'update');
    });

    it('logs and swallows errors instead of throwing', async () => {
        const newEntitlement = makeEntitlement();
        (entitlementService.capture as jest.Mock).mockRejectedValue(new Error('ds down'));

        await expect(entitlementUpdate.execute(null, newEntitlement)).resolves.not.toThrow();

        expect(Logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to capture entitlementUpdate for entitlement ent-1')
        );
    });
});
