const mockQuery = jest.fn();

jest.mock('pg', () => ({
    Pool: jest.fn().mockImplementation(() => ({
        query: mockQuery,
        on: jest.fn(),
        end: jest.fn(),
    })),
}));

import { DatabaseService } from '../../src/db/DatabaseService';
import { AnalyticsService } from '../../src/services/AnalyticsService';

const config = { host: 'localhost', user: 'u', password: 'p', database: 'd' };

describe('DatabaseService.insert RETURNING behaviour', () => {
    let db: DatabaseService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
        db = new DatabaseService(config);
    });

    const sqlOf = () => (mockQuery.mock.calls[0][0] as string);

    it('appends RETURNING * by default, so existing callers are unaffected', async () => {
        await db.insert('server', 'servers', { id: '1' });

        expect(sqlOf()).toContain('RETURNING *');
    });

    it('omits RETURNING when explicitly disabled', async () => {
        // RETURNING requires SELECT on the returned columns. A table the app may
        // write but not read fails with "permission denied" if it is present.
        await db.insert('analytics', 'events', { service: 'bs' }, { returning: false });

        expect(sqlOf()).not.toContain('RETURNING');
    });

    it('still reports affected rows when not returning', async () => {
        mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

        const result = await db.insert('analytics', 'events', { service: 'bs' }, { returning: false });

        expect(result.affectedRows).toBe(1);
    });
});

describe('AnalyticsService.logEvent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    });

    it('writes the event without RETURNING, since bot_user has INSERT but not SELECT', async () => {
        const db = new DatabaseService(config);
        const analytics = new AnalyticsService(db);

        await analytics.logEvent('bs', 'command', 'truth', '123', '456');

        const sql = mockQuery.mock.calls[0][0] as string;
        expect(sql).toContain('INSERT INTO "analytics"."events"');
        expect(sql).not.toContain('RETURNING');
    });
});
