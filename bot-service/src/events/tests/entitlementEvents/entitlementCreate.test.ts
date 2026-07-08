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

import entitlementCreate from '../../entitlementEvents/entitlementCreate';
import { entitlementService } from '../../../services';
import { Logger } from '@vulps22/logger';

const makeEntitlement = (overrides: Partial<Entitlement> = {}): Entitlement => ({
    id: 'ent-1',
    skuId: 'sku-1',
    userId: 'user-1',
    guildId: 'guild-1',
    ...overrides,
} as Entitlement);

describe('entitlementCreate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('has the correct event name and once flag', () => {
        expect(entitlementCreate.event).toBe('entitlementCreate');
        expect(entitlementCreate.once).toBe(false);
    });

    it('captures the entitlement as a create event', async () => {
        const entitlement = makeEntitlement();
        (entitlementService.capture as jest.Mock).mockResolvedValue(undefined);

        await entitlementCreate.execute(entitlement);

        expect(entitlementService.capture).toHaveBeenCalledWith(entitlement, 'create');
    });

    it('logs and swallows errors instead of throwing', async () => {
        const entitlement = makeEntitlement();
        (entitlementService.capture as jest.Mock).mockRejectedValue(new Error('ds down'));

        await expect(entitlementCreate.execute(entitlement)).resolves.not.toThrow();

        expect(Logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to capture entitlementCreate for entitlement ent-1')
        );
    });
});
