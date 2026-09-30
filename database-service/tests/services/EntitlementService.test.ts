import { EntitlementService } from '../../src/services/EntitlementService';
import { DatabaseService } from '../../src/db/DatabaseService';

describe('EntitlementService', () => {
    let db: jest.Mocked<Pick<DatabaseService, 'insert' | 'query' | 'get' | 'execute'>>;
    let service: EntitlementService;

    beforeEach(() => {
        db = {
            insert: jest.fn(),
            query: jest.fn(),
            get: jest.fn(),
            execute: jest.fn(),
        };
        service = new EntitlementService(db as unknown as DatabaseService);
    });

    describe('record', () => {
        it('inserts a row into entitlement.audit with the JSON-stringified payload', async () => {
            const row = { id: 1, entitlement_id: 'ent-1', type: 'create', source: 'gateway', data: '{"foo":"bar"}', created_at: '2026-01-01' };
            db.insert.mockResolvedValue({ rows: [row], rowCount: 1 } as any);

            const result = await service.record('ent-1', 'create', { foo: 'bar' }, 'gateway');

            expect(db.insert).toHaveBeenCalledWith('entitlement', 'audit', {
                entitlement_id: 'ent-1',
                type: 'create',
                data: '{"foo":"bar"}',
                source: 'gateway',
            });
            expect(result).toEqual(row);
        });

        it('defaults source to "gateway" when not provided', async () => {
            db.insert.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 } as any);

            await service.record('ent-1', 'update', { foo: 'bar' });

            expect(db.insert).toHaveBeenCalledWith('entitlement', 'audit', expect.objectContaining({ source: 'gateway' }));
        });

        it('throws if the insert returns no rows', async () => {
            db.insert.mockResolvedValue({ rows: [], rowCount: 0 } as any);

            await expect(service.record('ent-1', 'create', {})).rejects.toThrow('Failed to record entitlement audit event');
        });
    });

    describe('latestByEntitlementId', () => {
        it('returns the most recent audit row for the entitlement ID', async () => {
            const row = { id: 2, entitlement_id: 'ent-1', type: 'update', source: 'reconciliation', data: {}, created_at: '2026-01-02' };
            db.query.mockResolvedValue([row] as any);

            const result = await service.latestByEntitlementId('ent-1');

            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE entitlement_id = $1'), ['ent-1']);
            expect(result).toEqual(row);
        });

        it('returns null when there is no audit row for the entitlement ID', async () => {
            db.query.mockResolvedValue([] as any);

            const result = await service.latestByEntitlementId('missing');

            expect(result).toBeNull();
        });
    });

    describe('distinctOpenEntitlementIds', () => {
        it('returns entitlement IDs whose latest event is not "delete"', async () => {
            db.query.mockResolvedValue([
                { entitlement_id: 'ent-1', type: 'create' },
                { entitlement_id: 'ent-2', type: 'update' },
                { entitlement_id: 'ent-3', type: 'delete' },
            ] as any);

            const result = await service.distinctOpenEntitlementIds();

            expect(result).toEqual(['ent-1', 'ent-2']);
        });

        it('returns an empty array when there are no audit rows', async () => {
            db.query.mockResolvedValue([] as any);

            const result = await service.distinctOpenEntitlementIds();

            expect(result).toEqual([]);
        });
    });

    describe('findPurchasable', () => {
        it('looks up a purchasable by sku_id', async () => {
            const purchasable = { sku_id: 'sku-1', name: 'Premium' };
            db.get.mockResolvedValue(purchasable as any);

            const result = await service.findPurchasable({ sku_id: 'sku-1' });

            expect(db.get).toHaveBeenCalledWith('entitlement', 'purchasables', { sku_id: 'sku-1' });
            expect(result).toEqual(purchasable);
        });

        it('returns null when no purchasable matches the sku_id', async () => {
            db.get.mockResolvedValue(null);

            const result = await service.findPurchasable({ sku_id: 'unknown-sku' });

            expect(result).toBeNull();
        });

        it('looks up a purchasable by name slug and environment', async () => {
            db.get.mockResolvedValue({ sku_id: 'sku-1', name: 'skip-pack' } as any);

            await service.findPurchasable({ name: 'skip-pack', environment: 'prod' });

            expect(db.get).toHaveBeenCalledWith('entitlement', 'purchasables', { name: 'skip-pack', environment: 'prod' });
        });
    });

    describe('claim', () => {
        const entitlement = { id: 'ent-1', skuId: 'sku-1', userId: 'user-1', guildId: null, type: 8, startsTimestamp: 1767225600000, endsTimestamp: null };

        it('inserts into entitlement.entitlements with ON CONFLICT DO NOTHING and returns the claimed row', async () => {
            const row = { id: 'ent-1', consumed: false };
            db.get.mockResolvedValue({ type: 'consumable' } as any);
            db.execute.mockResolvedValue({ affectedRows: 1, rows: [row] });

            const result = await service.claim(entitlement);

            const [sql, params] = db.execute.mock.calls[0];
            expect(sql).toContain('INSERT INTO "entitlement"."entitlements"');
            expect(sql).toContain('ON CONFLICT ("id") DO NOTHING');
            expect(params).toEqual([
                'ent-1', 'sku-1', 'user-1', null, 8,
                new Date(1767225600000), null, true, JSON.stringify(entitlement),
            ]);
            expect(result).toEqual(row);
        });

        it('marks the claim as not consumable when the SKU is a subscription or unknown', async () => {
            db.get.mockResolvedValue(null);
            db.execute.mockResolvedValue({ affectedRows: 1, rows: [{ id: 'ent-1' }] });

            await service.claim(entitlement);

            expect(db.execute.mock.calls[0][1]?.[7]).toBe(false);
        });

        it('returns null when the entitlement has already been claimed', async () => {
            db.get.mockResolvedValue(null);
            db.execute.mockResolvedValue({ affectedRows: 0, rows: [] });

            expect(await service.claim(entitlement)).toBeNull();
        });
    });

    describe('release', () => {
        it('deletes only an unconsumed claim and reports whether one was released', async () => {
            db.execute.mockResolvedValue({ affectedRows: 1 });

            expect(await service.release('ent-1')).toBe(true);
            expect(db.execute).toHaveBeenCalledWith(expect.stringContaining('"consumed" = FALSE'), ['ent-1']);
        });

        it('returns false when there was nothing to release', async () => {
            db.execute.mockResolvedValue({ affectedRows: 0 });

            expect(await service.release('ent-1')).toBe(false);
        });
    });

    describe('markConsumed', () => {
        it('returns the updated row, or null when never claimed', async () => {
            db.execute.mockResolvedValueOnce({ affectedRows: 1, rows: [{ id: 'ent-1', consumed: true }] });
            expect(await service.markConsumed('ent-1')).toEqual({ id: 'ent-1', consumed: true });

            db.execute.mockResolvedValueOnce({ affectedRows: 0, rows: [] });
            expect(await service.markConsumed('ent-1')).toBeNull();
        });
    });

    describe('revoke', () => {
        it('only revokes a claim that is not already deleted', async () => {
            db.execute.mockResolvedValue({ affectedRows: 1, rows: [{ id: 'ent-1', deleted: true }] });

            const result = await service.revoke('ent-1');

            expect(db.execute).toHaveBeenCalledWith(expect.stringContaining('"deleted" = FALSE'), ['ent-1']);
            expect(result).toEqual({ id: 'ent-1', deleted: true });
        });

        it('returns null on a repeat revoke', async () => {
            db.execute.mockResolvedValue({ affectedRows: 0, rows: [] });

            expect(await service.revoke('ent-1')).toBeNull();
        });
    });

    describe('hasDrifted', () => {
        it('reports no drift for the same entitlement seen in gateway shape vs Discord REST shape', () => {
            // Gateway-captured shape: discord.js Entitlement fields, camelCase, epoch-ms timestamps.
            const gatewayShaped = {
                id: '1524250318299332609',
                type: 4,
                skuId: '1335708253165719572',
                userId: '914368203482890240',
                deleted: false,
                guildId: null,
                consumed: false,
                startsTimestamp: null,
                endsTimestamp: null,
            };

            // Reconciliation-fetched shape: raw Discord REST entitlement, snake_case, ISO timestamps,
            // plus bookkeeping fields (fulfillment_status etc.) that never appear on the gateway side.
            const restShaped = {
                id: '1524250318299332609',
                sku_id: '1335708253165719572',
                user_id: '914368203482890240',
                guild_id: null,
                type: 4,
                deleted: false,
                consumed: false,
                starts_at: null,
                ends_at: null,
                application_id: '1220074294290157568',
                promotion_id: null,
                source_type: 10,
                fulfilled_at: '2026-07-08T03:06:17.444586+00:00',
                fulfillment_status: 3,
                gift_code_flags: 0,
            };

            expect(service.hasDrifted(gatewayShaped, restShaped)).toBe(false);
        });

        it('reports no drift when equivalent timestamps are expressed as epoch-ms vs ISO string', () => {
            const gatewayShaped = {
                id: 'ent-1',
                skuId: 'sku-1',
                userId: 'user-1',
                type: 1,
                deleted: false,
                consumed: false,
                startsTimestamp: Date.parse('2026-02-02T22:33:05.093Z'),
                endsTimestamp: null,
            };
            const restShaped = {
                id: 'ent-1',
                sku_id: 'sku-1',
                user_id: 'user-1',
                type: 1,
                deleted: false,
                consumed: false,
                starts_at: '2026-02-02T22:33:05.093Z',
                ends_at: null,
            };

            expect(service.hasDrifted(gatewayShaped, restShaped)).toBe(false);
        });

        it('reports drift when a meaningful field genuinely changes (e.g. deleted/refunded)', () => {
            const latest = { id: 'ent-1', sku_id: 'sku-1', user_id: 'user-1', type: 1, deleted: false, consumed: false };
            const incoming = { id: 'ent-1', sku_id: 'sku-1', user_id: 'user-1', type: 1, deleted: true, consumed: false };

            expect(service.hasDrifted(latest, incoming)).toBe(true);
        });

        it('reports drift when consumed state changes', () => {
            const latest = { id: 'ent-1', skuId: 'sku-1', userId: 'user-1', type: 4, deleted: false, consumed: false };
            const incoming = { id: 'ent-1', sku_id: 'sku-1', user_id: 'user-1', type: 4, deleted: false, consumed: true };

            expect(service.hasDrifted(latest, incoming)).toBe(true);
        });

        it('treats missing and null values consistently across shapes', () => {
            const latest = { id: 'ent-1', skuId: 'sku-1' };
            const incoming = { id: 'ent-1', sku_id: 'sku-1', user_id: null, guild_id: null };

            expect(service.hasDrifted(latest, incoming)).toBe(false);
        });
    });
});
