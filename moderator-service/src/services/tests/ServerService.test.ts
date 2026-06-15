import { ServerService } from '../ServerService';
import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { Logger } from '../../bot/utils';

jest.mock('../../bot/services/DatabaseClient');
jest.mock('../../bot/utils');
jest.mock('../../bot/config', () => ({
  Config: {
    OFFICIAL_GUILD_ID: '1079206786021732412'
  }
}));

describe('ServerService', () => {
  let serverService: ServerService;
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      banUserServers: jest.fn(),
      unbanUserServers: jest.fn(),
      getUserOwnedServerCount: jest.fn(),
      getServerUserCount: jest.fn(),
      getServerBannedUserCount: jest.fn(),
      upsertServer: jest.fn(),
      getServer: jest.fn(),
      updateServer: jest.fn(),
    } as any;

    serverService = new ServerService(mockDb);
  });

  describe('banUserServers', () => {
    it('should ban all non-banned servers owned by user', async () => {
      mockDb.banUserServers.mockResolvedValue(2);

      const result = await serverService.banUserServers('123456789012345678', 'Spam');

      expect(mockDb.banUserServers).toHaveBeenCalledWith('123456789012345678', 'Spam');
      expect(Logger.debug).toHaveBeenCalledWith('Banning all servers owned by user 123456789012345678 with reason: Spam');
      expect(Logger.debug).toHaveBeenCalledWith('Banned 2 servers owned by user 123456789012345678');
      expect(result).toBe(2);
    });

    it('should return 0 when user owns no unbanned servers', async () => {
      mockDb.banUserServers.mockResolvedValue(0);

      const result = await serverService.banUserServers('123456789012345678', 'Spam');

      expect(result).toBe(0);
    });
  });

  describe('unbanUserServers', () => {
    it('should unban all banned servers owned by user', async () => {
      mockDb.unbanUserServers.mockResolvedValue(3);

      const result = await serverService.unbanUserServers('123456789012345678');

      expect(mockDb.unbanUserServers).toHaveBeenCalledWith('123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('Unbanning all servers owned by user 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('Unbanned 3 servers owned by user 123456789012345678');
      expect(result).toBe(3);
    });

    it('should return 0 when user owns no banned servers', async () => {
      mockDb.unbanUserServers.mockResolvedValue(0);

      const result = await serverService.unbanUserServers('123456789012345678');

      expect(result).toBe(0);
    });
  });

  describe('getUserOwnedServerCount', () => {
    it('should return count of servers owned by user', async () => {
      mockDb.getUserOwnedServerCount.mockResolvedValue(5);

      const result = await serverService.getUserOwnedServerCount('123456789012345678');

      expect(mockDb.getUserOwnedServerCount).toHaveBeenCalledWith('123456789012345678');
      expect(result).toBe(5);
    });

    it('should return 0 when user owns no servers', async () => {
      mockDb.getUserOwnedServerCount.mockResolvedValue(0);

      const result = await serverService.getUserOwnedServerCount('123456789012345678');

      expect(result).toBe(0);
    });
  });

  describe('acceptTerms', () => {
    it('should mark server as having accepted terms', async () => {
      mockDb.updateServer.mockResolvedValue({} as any);

      await serverService.acceptTerms('987654321');

      expect(Logger.debug).toHaveBeenCalledWith('Updating server settings for 987654321');
    });
  });

  describe('acceptRules', () => {
    it('should grant can_create permission', async () => {
      mockDb.updateServer.mockResolvedValue({} as any);

      await serverService.acceptRules('987654321');

      expect(mockDb.updateServer).toHaveBeenCalledWith('987654321', { can_create: true });
    });
  });

  describe('setAnnouncementChannel', () => {
    it('should set announcement channel', async () => {
      mockDb.updateServer.mockResolvedValue({} as any);

      await serverService.setAnnouncementChannel('987654321', '111222333');

      expect(Logger.debug).toHaveBeenCalledWith('Setting announcement channel for server 987654321 to 111222333');
      expect(mockDb.updateServer).toHaveBeenCalledWith('987654321', { announcement_channel: '111222333' });
    });
  });

  describe('isServerBanned', () => {
    it('should return false for the official guild regardless of ban status', async () => {
      const result = await serverService.isServerBanned('1079206786021732412');
      expect(result).toBe(false);
      expect(mockDb.getServer).not.toHaveBeenCalled();
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
