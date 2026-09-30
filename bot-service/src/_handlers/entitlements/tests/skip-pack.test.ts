import { Entitlement } from 'discord.js';

jest.mock('@vulps22/logger', () => ({
    Logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../../../services', () => ({
    entitlementService: {
        claim: jest.fn(),
        release: jest.fn(),
        markConsumed: jest.fn(),
        revoke: jest.fn(),
    },
    inventoryService: {
        add: jest.fn(),
        get: jest.fn(),
        consume: jest.fn(),
    },
}));

import skipPack from '../skip-pack';
import { entitlementService, inventoryService } from '../../../services';
import { Logger } from '@vulps22/logger';

const makeEntitlement = (): Entitlement & { consume: jest.Mock } => ({
    id: 'ent-1',
    skuId: 'sku-1',
    userId: 'user-1',
    consume: jest.fn().mockResolvedValue(undefined),
} as unknown as Entitlement & { consume: jest.Mock });

describe('skip-pack entitlement handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (entitlementService.release as jest.Mock).mockResolvedValue(undefined);
    });

    it('is named after the purchasable slug', () => {
        expect(skipPack.name).toBe('skip-pack');
    });

    describe('create', () => {
        it('claims, grants 10 skips, then consumes the entitlement', async () => {
            const entitlement = makeEntitlement();
            (entitlementService.claim as jest.Mock).mockResolvedValue(true);

            await skipPack.create(entitlement);

            expect(entitlementService.claim).toHaveBeenCalledWith(entitlement);
            expect(inventoryService.add).toHaveBeenCalledWith('user-1', 'skip', 10);
            expect(entitlement.consume).toHaveBeenCalled();
            expect(entitlementService.markConsumed).toHaveBeenCalledWith('ent-1');
        });

        it('does not grant again when the entitlement was already claimed', async () => {
            const entitlement = makeEntitlement();
            (entitlementService.claim as jest.Mock).mockResolvedValue(false);

            await skipPack.create(entitlement);

            expect(inventoryService.add).not.toHaveBeenCalled();
            expect(entitlement.consume).not.toHaveBeenCalled();
        });

        it('releases the claim and rethrows when the grant fails', async () => {
            const entitlement = makeEntitlement();
            (entitlementService.claim as jest.Mock).mockResolvedValue(true);
            (inventoryService.add as jest.Mock).mockRejectedValue(new Error('ds down'));

            await expect(skipPack.create(entitlement)).rejects.toThrow('ds down');

            expect(entitlementService.release).toHaveBeenCalledWith('ent-1');
            expect(entitlement.consume).not.toHaveBeenCalled();
        });

        it('logs rather than throws when consuming with Discord fails after the grant', async () => {
            const entitlement = makeEntitlement();
            (entitlementService.claim as jest.Mock).mockResolvedValue(true);
            (inventoryService.add as jest.Mock).mockResolvedValue({ qty: 10 });
            entitlement.consume.mockRejectedValue(new Error('discord down'));

            await expect(skipPack.create(entitlement)).resolves.not.toThrow();

            expect(entitlementService.release).not.toHaveBeenCalled();
            expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('failed to consume'));
        });
    });

    describe('delete', () => {
        it('deducts 10 skips when the user has at least 10', async () => {
            (entitlementService.revoke as jest.Mock).mockResolvedValue(true);
            (inventoryService.get as jest.Mock).mockResolvedValue({ qty: 15 });

            await skipPack.delete(makeEntitlement());

            expect(inventoryService.consume).toHaveBeenCalledWith('user-1', 'skip', 10);
        });

        it('floors at 0 when the user has fewer than 10 skips left', async () => {
            (entitlementService.revoke as jest.Mock).mockResolvedValue(true);
            (inventoryService.get as jest.Mock).mockResolvedValue({ qty: 3 });

            await skipPack.delete(makeEntitlement());

            expect(inventoryService.consume).toHaveBeenCalledWith('user-1', 'skip', 3);
        });

        it('deducts nothing when the user has no skips', async () => {
            (entitlementService.revoke as jest.Mock).mockResolvedValue(true);
            (inventoryService.get as jest.Mock).mockResolvedValue(null);

            await skipPack.delete(makeEntitlement());

            expect(inventoryService.consume).not.toHaveBeenCalled();
        });

        it('does nothing when there is nothing to revoke', async () => {
            (entitlementService.revoke as jest.Mock).mockResolvedValue(false);

            await skipPack.delete(makeEntitlement());

            expect(inventoryService.get).not.toHaveBeenCalled();
            expect(inventoryService.consume).not.toHaveBeenCalled();
        });
    });
});
