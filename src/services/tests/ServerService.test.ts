import { ServerService } from '../ServerService';
import { DatabaseService } from '../DatabaseService';
import { Logger } from '../../utils';
jest.mock('../DatabaseService');
jest.mock('../../utils');
jest.mock('../../config', () => ({
  Config: {
    OFFICIAL_GUILD_ID: '1079206786021732412'
  }
}));

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

      expect(mockDb.update).toHaveBeenCalledWith('server', 'servers', {
        is_banned: true,
        ban_reason: 'Spam'
      }, {
        user_id: BigInt('123456789012345678'),
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

      expect(mockDb.update).toHaveBeenCalledWith('server', 'servers', {
        is_banned: false,
        ban_reason: null
      }, {
        user_id: BigInt('123456789012345678'),
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

      expect(mockDb.count).toHaveBeenCalledWith('server', 'servers', {
        user_id: BigInt('123456789012345678')
      });
      expect(result).toBe(5);
    });

    it('should return 0 when user owns no servers', async () => {
      mockDb.count.mockResolvedValue(0);

      const result = await serverService.getUserOwnedServerCount('123456789012345678');

      expect(result).toBe(0);
    });
  });

  describe('acceptTerms', () => {
    it('should mark server as having accepted terms', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      await serverService.acceptTerms('987654321');

      expect(Logger.debug).toHaveBeenCalledWith('Server 987654321 accepted terms');
    });
  });

  describe('acceptRules', () => {
    it('should grant can_create permission', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      await serverService.acceptRules('987654321');

      expect(Logger.debug).toHaveBeenCalledWith('Server 987654321 accepted rules');
    });
  });

  describe('setAnnouncementChannel', () => {
    it('should set announcement channel', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      await serverService.setAnnouncementChannel('987654321', '111222333');

      expect(Logger.debug).toHaveBeenCalledWith('Setting announcement channel for server 987654321 to 111222333');
    });
  });

  describe('isServerBanned', () => {
    it('should return false for the official guild regardless of ban status', async () => {
      const result = await serverService.isServerBanned('1079206786021732412');
      expect(result).toBe(false);
      expect(mockDb.get).not.toHaveBeenCalled();
    });

    it('should return ban reason when server is banned', async () => {
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue({
        id: '987654321', is_banned: true, ban_reason: 'Hate Speech'
      } as any);

      const result = await serverService.isServerBanned('987654321');

      expect(result).toBe('Hate Speech');
    });

    it('should return default reason when server is banned with no reason', async () => {
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue({
        id: '987654321', is_banned: true, ban_reason: null
      } as any);

      const result = await serverService.isServerBanned('987654321');

      expect(result).toBe('No reason provided');
    });

    it('should return false when server is not banned', async () => {
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue({
        id: '987654321', is_banned: false, ban_reason: null
      } as any);

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
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue({
        id: '987654321', can_create: true, is_banned: false
      } as any);

      const result = await serverService.canCreate('987654321');

      expect(result).toBe(true);
    });

    it('should return false when can_create is false', async () => {
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue({
        id: '987654321', can_create: false, is_banned: false
      } as any);

      const result = await serverService.canCreate('987654321');

      expect(result).toBe(false);
    });

    it('should return false when server is banned even if can_create is true', async () => {
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue({
        id: '987654321', can_create: true, is_banned: true
      } as any);

      const result = await serverService.canCreate('987654321');

      expect(result).toBe(false);
    });

    it('should return false when server not found', async () => {
      jest.spyOn(serverService, 'getServerSettings').mockResolvedValue(null);

      const result = await serverService.canCreate('987654321');

      expect(result).toBe(false);
    });
  });
});
