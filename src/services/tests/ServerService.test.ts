import { ServerService } from '../ServerService';
import { DatabaseService } from '../DatabaseService';
import { Logger } from '../../utils';

jest.mock('../DatabaseService');
jest.mock('../../utils');

describe('ServerService', () => {
  let serverService: ServerService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = new DatabaseService({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test'
    }) as jest.Mocked<DatabaseService>;

    serverService = new ServerService(mockDb);
    jest.clearAllMocks();
  });

  describe('banUserServers', () => {
    it('should ban all non-banned servers owned by user', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 2, changedRows: 2 });

      const result = await serverService.banUserServers('123456789012345678', 'Spam');

      expect(mockDb.update).toHaveBeenCalledWith('core', 'servers', {
        is_banned: true,
        ban_reason: 'Spam'
      }, {
        owner: BigInt('123456789012345678'),
        is_banned: false
      });
      expect(Logger.debug).toHaveBeenCalledWith('Banning all servers owned by user 123456789012345678 with reason: Spam');
      expect(Logger.debug).toHaveBeenCalledWith('Banned 2 servers owned by user 123456789012345678');
      expect(result).toBe(2);
    });

    it('should return 0 when user owns no unbanned servers', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 0, changedRows: 0 });

      const result = await serverService.banUserServers('123456789012345678', 'Spam');

      expect(result).toBe(0);
    });
  });

  describe('unbanUserServers', () => {
    it('should unban all banned servers owned by user', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 3, changedRows: 3 });

      const result = await serverService.unbanUserServers('123456789012345678');

      expect(mockDb.update).toHaveBeenCalledWith('core', 'servers', {
        is_banned: false,
        ban_reason: null
      }, {
        owner: BigInt('123456789012345678'),
        is_banned: true
      });
      expect(Logger.debug).toHaveBeenCalledWith('Unbanning all servers owned by user 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('Unbanned 3 servers owned by user 123456789012345678');
      expect(result).toBe(3);
    });

    it('should return 0 when user owns no banned servers', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 0, changedRows: 0 });

      const result = await serverService.unbanUserServers('123456789012345678');

      expect(result).toBe(0);
    });
  });

  describe('getUserOwnedServerCount', () => {
    it('should return count of servers owned by user', async () => {
      mockDb.count.mockResolvedValue(5);

      const result = await serverService.getUserOwnedServerCount('123456789012345678');

      expect(mockDb.count).toHaveBeenCalledWith('core', 'servers', { 
        owner: BigInt('123456789012345678') 
      });
      expect(result).toBe(5);
    });

    it('should return 0 when user owns no servers', async () => {
      mockDb.count.mockResolvedValue(0);

      const result = await serverService.getUserOwnedServerCount('123456789012345678');

      expect(result).toBe(0);
    });
  });
});
