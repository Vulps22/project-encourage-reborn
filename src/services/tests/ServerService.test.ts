import { ServerService } from '../ServerService';
import { DatabaseService } from '../DatabaseService';
import { dsClient, DSError } from '../../client';
import { Logger } from '../../utils';
import { Server } from '../../interface';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

jest.mock('../DatabaseService');
jest.mock('../../utils');
jest.mock('../../config', () => ({
    Config: { OFFICIAL_GUILD_ID: '1079206786021732412' }
}));

const makeServer = (overrides: Partial<Server> = {}): Server => ({
    id: '987654321',
    name: 'Test Server',
    user_id: '111222333',
    has_accepted: false,
    can_create: false,
    is_banned: false,
    ban_reason: null,
    banned_by: null,
    datetime_banned: null,
    date_created: new Date(),
    date_updated: new Date(),
    dare_success_xp: 50,
    dare_fail_xp: 25,
    truth_success_xp: 40,
    truth_fail_xp: 40,
    message_xp: 0,
    level_up_channel: null,
    announcement_channel: null,
    is_entitled: false,
    entitlement_end_date: null,
    message_id: null,
    is_deleted: false,
    datetime_deleted: null,
    playtest_notified: false,
    ...overrides,
});

describe('ServerService', () => {
    let serverService: ServerService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = { update: jest.fn(), count: jest.fn(), query: jest.fn() } as any;
        serverService = new ServerService(mockDb);
    });

    describe('getOrCreateServer', () => {
        it('should upsert via DS when ownerId is provided', async () => {
            const server = makeServer();
            (dsClient.post as jest.Mock).mockResolvedValue(server);

            const result = await serverService.getOrCreateServer('987654321', 'Test Server', '111222333');

            expect(dsClient.post).toHaveBeenCalledWith('/server', undefined, {
                id: '987654321',
                name: 'Test Server',
                user_id: '111222333',
            });
            expect(result).toEqual(server);
        });

        it('should pass null name when not provided', async () => {
            const server = makeServer({ name: null });
            (dsClient.post as jest.Mock).mockResolvedValue(server);

            await serverService.getOrCreateServer('987654321', undefined, '111222333');

            expect(dsClient.post).toHaveBeenCalledWith('/server', undefined, {
                id: '987654321',
                name: null,
                user_id: '111222333',
            });
        });

        it('should fetch existing server when no ownerId provided', async () => {
            const server = makeServer();
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(server);

            const result = await serverService.getOrCreateServer('987654321');

            expect(result).toEqual(server);
            expect(dsClient.post).not.toHaveBeenCalled();
        });

        it('should throw when no ownerId and server not found', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(null);

            await expect(serverService.getOrCreateServer('987654321')).rejects.toThrow(
                'Owner ID required to create new server'
            );
        });
    });

    describe('getServerSettings', () => {
        it('should return server when found', async () => {
            const server = makeServer();
            (dsClient.get as jest.Mock).mockResolvedValue(server);

            const result = await serverService.getServerSettings('987654321');

            expect(dsClient.get).toHaveBeenCalledWith('/server/:id', { id: '987654321' });
            expect(result).toEqual(server);
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Server not found'));

            const result = await serverService.getServerSettings('987654321');

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Internal error'));

            await expect(serverService.getServerSettings('987654321')).rejects.toThrow('Internal error');
        });
    });

    describe('getServerByID', () => {
        it('should delegate to getServerSettings', async () => {
            const server = makeServer();
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(server);

            const result = await serverService.getServerByID('987654321');

            expect(result).toEqual(server);
        });
    });

    describe('updateServerSettings', () => {
        it('should patch server excluding id and user_id', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeServer({ has_accepted: true }));

            await serverService.updateServerSettings('987654321', { has_accepted: true, id: '987654321', user_id: '111' });

            expect(dsClient.patch).toHaveBeenCalledWith('/server/:id', { id: '987654321' }, { has_accepted: true });
        });
    });

    describe('acceptTerms', () => {
        it('should set has_accepted to true', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeServer());

            await serverService.acceptTerms('987654321');

            expect(Logger.debug).toHaveBeenCalledWith('Server 987654321 accepted terms');
            expect(dsClient.patch).toHaveBeenCalledWith('/server/:id', { id: '987654321' }, { has_accepted: true });
        });
    });

    describe('acceptRules', () => {
        it('should set can_create to true', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeServer());

            await serverService.acceptRules('987654321');

            expect(Logger.debug).toHaveBeenCalledWith('Server 987654321 accepted rules');
            expect(dsClient.patch).toHaveBeenCalledWith('/server/:id', { id: '987654321' }, { can_create: true });
        });
    });

    describe('setAnnouncementChannel', () => {
        it('should set announcement_channel', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeServer());

            await serverService.setAnnouncementChannel('987654321', '111222333');

            expect(Logger.debug).toHaveBeenCalledWith('Setting announcement channel for server 987654321 to 111222333');
            expect(dsClient.patch).toHaveBeenCalledWith('/server/:id', { id: '987654321' }, { announcement_channel: '111222333' });
        });
    });

    describe('isServerBanned', () => {
        it('should return false for the official guild regardless of ban status', async () => {
            const result = await serverService.isServerBanned('1079206786021732412');

            expect(result).toBe(false);
            expect(dsClient.get).not.toHaveBeenCalled();
        });

        it('should return ban reason when server is banned', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(
                makeServer({ is_banned: true, ban_reason: 'Hate Speech' })
            );

            const result = await serverService.isServerBanned('987654321');

            expect(result).toBe('Hate Speech');
        });

        it('should return default reason when server is banned with no reason', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(
                makeServer({ is_banned: true, ban_reason: null })
            );

            const result = await serverService.isServerBanned('987654321');

            expect(result).toBe('No reason provided');
        });

        it('should return false when server is not banned', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(
                makeServer({ is_banned: false })
            );

            const result = await serverService.isServerBanned('987654321');

            expect(result).toBe(false);
        });

        it('should return false when server not found', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(null);

            const result = await serverService.isServerBanned('987654321');

            expect(result).toBe(false);
        });
    });

    describe('canCreate', () => {
        it('should return true when server can create and is not banned', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(
                makeServer({ can_create: true, is_banned: false })
            );

            const result = await serverService.canCreate('987654321');

            expect(result).toBe(true);
        });

        it('should return false when can_create is false', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(
                makeServer({ can_create: false, is_banned: false })
            );

            const result = await serverService.canCreate('987654321');

            expect(result).toBe(false);
        });

        it('should return false when server is banned even if can_create is true', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(
                makeServer({ can_create: true, is_banned: true })
            );

            const result = await serverService.canCreate('987654321');

            expect(result).toBe(false);
        });

        it('should return false when server not found', async () => {
            jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(null);

            const result = await serverService.canCreate('987654321');

            expect(result).toBe(false);
        });
    });

    describe('banUserServers', () => {
        it('should ban all non-banned servers owned by user', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 2, changedRows: 2 });

            const result = await serverService.banUserServers('123456789012345678', 'Spam');

            expect(mockDb.update).toHaveBeenCalledWith('server', 'servers', {
                is_banned: true,
                ban_reason: 'Spam'
            }, {
                user_id: BigInt('123456789012345678'),
                is_banned: false
            });
            expect(result).toBe(2);
        });

        it('should return 0 when user owns no unbanned servers', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 0, changedRows: 0 });

            const result = await serverService.banUserServers('123456789012345678', 'Spam');

            expect(result).toBe(0);
        });
    });

    describe('unbanUserServers', () => {
        it('should unban all banned servers owned by user', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 3, changedRows: 3 });

            const result = await serverService.unbanUserServers('123456789012345678');

            expect(mockDb.update).toHaveBeenCalledWith('server', 'servers', {
                is_banned: false,
                ban_reason: null
            }, {
                user_id: BigInt('123456789012345678'),
                is_banned: true
            });
            expect(result).toBe(3);
        });

        it('should return 0 when user owns no banned servers', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 0, changedRows: 0 });

            const result = await serverService.unbanUserServers('123456789012345678');

            expect(result).toBe(0);
        });
    });

    describe('getUserOwnedServerCount', () => {
        it('should return count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(5);

            const result = await serverService.getUserOwnedServerCount('123456789012345678');

            expect(mockDb.count).toHaveBeenCalledWith('server', 'servers', {
                user_id: BigInt('123456789012345678')
            });
            expect(result).toBe(5);
        });
    });
});
