import { EntitlementService } from '../EntitlementService';
import { dsClient } from '../../client';
import { Entitlement } from 'discord.js';

jest.mock('../../client', () => ({
    dsClient: {
        recordEntitlementEvent: jest.fn(),
        reconcileEntitlements: jest.fn(),
    },
}));

jest.mock('@vulps22/logger', () => ({
    Logger: {
        error: jest.fn(),
        log: jest.fn(),
    },
}));

const mockRestGet = jest.fn();
jest.mock('discord.js', () => {
    const actual = jest.requireActual('discord.js');
    return {
        ...actual,
        REST: class {
            setToken() {
                return this;
            }
            get = mockRestGet;
        },
    };
});

const { Logger } = require('@vulps22/logger');

const makeEntitlement = (overrides: Partial<Entitlement> = {}): Entitlement => ({
    id: 'ent-1',
    skuId: 'sku-1',
    userId: 'user-1',
    guildId: 'guild-1',
    type: 1,
    deleted: false,
    startsTimestamp: null,
    endsTimestamp: null,
    consumed: false,
    ...overrides,
} as Entitlement);

describe('EntitlementService', () => {
    let service: EntitlementService;
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...ORIGINAL_ENV, PE_DISCORD_TOKEN: 'test-token', PE_CLIENT_ID: 'test-client-id' };
        service = new EntitlementService();
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    describe('capture', () => {
        it('forwards a create event to DS with the raw entitlement shape', async () => {
            const entitlement = makeEntitlement();
            (dsClient.recordEntitlementEvent as jest.Mock).mockResolvedValue(undefined);

            await service.capture(entitlement, 'create');

            expect(dsClient.recordEntitlementEvent).toHaveBeenCalledWith('create', 'ent-1', {
                id: 'ent-1',
                skuId: 'sku-1',
                userId: 'user-1',
                guildId: 'guild-1',
                type: 1,
                deleted: false,
                startsTimestamp: null,
                endsTimestamp: null,
                consumed: false,
            });
        });

        it('forwards update events with type "update"', async () => {
            const entitlement = makeEntitlement();
            (dsClient.recordEntitlementEvent as jest.Mock).mockResolvedValue(undefined);

            await service.capture(entitlement, 'update');

            expect(dsClient.recordEntitlementEvent).toHaveBeenCalledWith('update', 'ent-1', expect.any(Object));
        });

        it('forwards delete events with type "delete"', async () => {
            const entitlement = makeEntitlement();
            (dsClient.recordEntitlementEvent as jest.Mock).mockResolvedValue(undefined);

            await service.capture(entitlement, 'delete');

            expect(dsClient.recordEntitlementEvent).toHaveBeenCalledWith('delete', 'ent-1', expect.any(Object));
        });

        it('logs and swallows errors instead of throwing', async () => {
            const entitlement = makeEntitlement();
            (dsClient.recordEntitlementEvent as jest.Mock).mockRejectedValue(new Error('network fail'));

            await expect(service.capture(entitlement, 'create')).resolves.not.toThrow();

            expect(Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to record entitlement create event for entitlement ent-1')
            );
        });
    });

    describe('reconcile', () => {
        it('does not call DS and logs an error if PE_DISCORD_TOKEN is missing', async () => {
            delete process.env.PE_DISCORD_TOKEN;

            await service.reconcile();

            expect(mockRestGet).not.toHaveBeenCalled();
            expect(dsClient.reconcileEntitlements).not.toHaveBeenCalled();
            expect(Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('PE_DISCORD_TOKEN or PE_CLIENT_ID is not set')
            );
        });

        it('does not call DS and logs an error if PE_CLIENT_ID is missing', async () => {
            delete process.env.PE_CLIENT_ID;

            await service.reconcile();

            expect(mockRestGet).not.toHaveBeenCalled();
            expect(dsClient.reconcileEntitlements).not.toHaveBeenCalled();
        });

        it('fetches Discord\'s current entitlement list and forwards it to DS', async () => {
            const fakeEntitlements = [{ id: '1', sku_id: 'sku-1' }];
            mockRestGet.mockResolvedValue(fakeEntitlements);
            (dsClient.reconcileEntitlements as jest.Mock).mockResolvedValue(undefined);

            await service.reconcile();

            expect(mockRestGet).toHaveBeenCalledTimes(1);
            expect(dsClient.reconcileEntitlements).toHaveBeenCalledWith(fakeEntitlements);
        });

        it('logs and swallows errors raised while fetching from Discord', async () => {
            mockRestGet.mockRejectedValue(new Error('discord down'));

            await expect(service.reconcile()).resolves.not.toThrow();

            expect(dsClient.reconcileEntitlements).not.toHaveBeenCalled();
            expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to reconcile entitlements'));
        });

        it('logs and swallows errors raised while forwarding to DS', async () => {
            mockRestGet.mockResolvedValue([]);
            (dsClient.reconcileEntitlements as jest.Mock).mockRejectedValue(new Error('ds down'));

            await expect(service.reconcile()).resolves.not.toThrow();

            expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to reconcile entitlements'));
        });
    });
});
