import { UserService } from '../UserService';
import { DatabaseService } from '../DatabaseService';
import { dsClient, DSError } from '../../client';
import { Logger } from '../../utils';
import { User } from '../../interface';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

jest.mock('../DatabaseService');
jest.mock('../../utils', () => ({
    Logger: { debug: jest.fn(), error: jest.fn() },
}));

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: '123456789012345678',
    username: 'testuser',
    global_level: 5,
    global_level_xp: 250,
    banned_questions: 0,
    rules_accepted: true,
    is_banned: false,
    ban_reason: null,
    vote_count: 10,
    ban_message_id: null,
    delete_date: null,
    created_datetime: new Date(),
    ...overrides,
});

describe('UserService', () => {
    let userService: UserService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = { count: jest.fn(), query: jest.fn() } as any;
        userService = new UserService(mockDb);
    });

    describe('getUser', () => {
        it('should return user when found', async () => {
            const user = makeUser();
            (dsClient.get as jest.Mock).mockResolvedValue(user);

            const result = await userService.getUser('123456789012345678');

            expect(dsClient.get).toHaveBeenCalledWith('/user/:id', { id: '123456789012345678' });
            expect(result).toEqual(user);
            expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 retrieved successfully');
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'User not found'));

            const result = await userService.getUser('999999999999999999');

            expect(result).toBeNull();
            expect(Logger.debug).toHaveBeenCalledWith('User 999999999999999999 not found');
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Internal error'));

            await expect(userService.getUser('123456789012345678')).rejects.toThrow('Internal error');
        });
    });

    describe('setUser', () => {
        it('should upsert and return the user', async () => {
            const user = makeUser();
            (dsClient.post as jest.Mock).mockResolvedValue(user);

            const result = await userService.setUser({ id: '123456789012345678', username: 'testuser' });

            expect(dsClient.post).toHaveBeenCalledWith('/user', undefined, {
                id: '123456789012345678',
                username: 'testuser',
            });
            expect(result).toEqual(user);
            expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 upserted successfully');
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(500, 'Failed'));

            await expect(userService.setUser({ id: '123', username: 'u' })).rejects.toThrow('Failed');
        });
    });

    describe('banUser', () => {
        it('should ban user with reason', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeUser({ is_banned: true }));

            await userService.banUser('123456789012345678', 'Spam');

            expect(dsClient.patch).toHaveBeenCalledWith('/user/:id/ban', { id: '123456789012345678' }, {
                ban_reason: 'Spam',
            });
            expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 banned successfully');
        });

        it('should include ban_message_id when provided', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeUser({ is_banned: true }));

            await userService.banUser('123456789012345678', 'Spam', '999888777666555444');

            expect(dsClient.patch).toHaveBeenCalledWith('/user/:id/ban', { id: '123456789012345678' }, {
                ban_reason: 'Spam',
                ban_message_id: '999888777666555444',
            });
        });
    });

    describe('unbanUser', () => {
        it('should call unban endpoint', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeUser());

            await userService.unbanUser('123456789012345678');

            expect(dsClient.patch).toHaveBeenCalledWith('/user/:id/unban', { id: '123456789012345678' });
            expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 unbanned successfully');
        });
    });

    describe('isUserBanned', () => {
        it('should return ban reason when user is banned', async () => {
            (dsClient.get as jest.Mock).mockResolvedValue(makeUser({ is_banned: true, ban_reason: 'Harassment' }));

            const result = await userService.isUserBanned('123456789012345678');

            expect(result).toBe('Harassment');
        });

        it('should return default reason when banned with no reason', async () => {
            (dsClient.get as jest.Mock).mockResolvedValue(makeUser({ is_banned: true, ban_reason: null }));

            const result = await userService.isUserBanned('123456789012345678');

            expect(result).toBe('No reason provided');
        });

        it('should return false when user is not banned', async () => {
            (dsClient.get as jest.Mock).mockResolvedValue(makeUser({ is_banned: false }));

            const result = await userService.isUserBanned('123456789012345678');

            expect(result).toBe(false);
        });

        it('should return false when user does not exist', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            const result = await userService.isUserBanned('123456789012345678');

            expect(result).toBe(false);
        });
    });

    describe('getUserServerCount', () => {
        it('should return count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(5);

            const result = await userService.getUserServerCount('123456789012345678');

            expect(mockDb.count).toHaveBeenCalledWith('server', 'server_users', {
                user_id: BigInt('123456789012345678')
            });
            expect(result).toBe(5);
        });
    });

    describe('getUserBannedServerCount', () => {
        it('should return banned server count from db', async () => {
            (mockDb.query as jest.Mock).mockResolvedValue([{ count: '3' }]);

            const result = await userService.getUserBannedServerCount('123456789012345678');

            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*)'),
                [BigInt('123456789012345678')]
            );
            expect(result).toBe(3);
        });

        it('should return 0 when query returns empty result', async () => {
            (mockDb.query as jest.Mock).mockResolvedValue([]);

            const result = await userService.getUserBannedServerCount('123456789012345678');

            expect(result).toBe(0);
        });
    });
});
