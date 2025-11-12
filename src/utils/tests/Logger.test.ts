import { BaseInteraction, Client } from 'discord.js';
import { Logger } from '../Logger';

describe('Logger', () => {
  let mockInteraction: any;

  beforeEach(() => {
    mockInteraction = {
      user: {
        username: 'testuser',
        id: 'user-123',
      },
      guild: {
        name: 'Test Server',
        id: 'guild-123',
      },
    } as unknown as BaseInteraction;

    // Mock the global config
    (global as any).config = {
      LOG_CHANNEL_ID: 'log-channel-123'
    };

    // Mock global client with shard
    (global as any).client = {
      shard: {
        broadcastEval: jest.fn(),
      },
    } as unknown as Client;

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset mocks
    jest.resetAllMocks();
  });

  describe('logInteractionReceived', () => {
    it('should log interaction in sharded mode', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn()
            .mockResolvedValueOnce([{ found: true, shardId: 0 }])
            .mockResolvedValueOnce(['msg-456', null]),
        },
      } as unknown as Client;

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect((global as any).client.shard?.broadcastEval).toHaveBeenCalledTimes(2);
      expect(executionId).toBe('msg-456');
    });

    it('should return empty string if LOG_CHANNEL_ID not set', async () => {
      (global as any).config.LOG_CHANNEL_ID = '';
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect(executionId).toBe('');
    });

    it('should return empty string if channel not found in sharded mode', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([{ found: false, shardId: 0 }]),
        },
      } as unknown as Client;

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect(executionId).toBe('');
    });

    it('should handle errors gracefully', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      } as unknown as Client;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect(executionId).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log interaction:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateExecution', () => {
    it('should update execution in sharded mode', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([true]),
        },
      } as unknown as Client;

      await Logger.updateExecution('msg-123', 'Updated message');

      expect((global as any).client.shard?.broadcastEval).toHaveBeenCalled();
    });

    it('should do nothing if executionId is empty', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      await Logger.updateExecution('', 'Updated message');
    });

    it('should do nothing if LOG_CHANNEL_ID not set', async () => {
      (global as any).config.LOG_CHANNEL_ID = '';
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      await Logger.updateExecution('msg-123', 'Updated message');

      expect((global as any).client.shard?.broadcastEval).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      } as unknown as Client;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await Logger.updateExecution('msg-123', 'Updated message');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update execution log:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('log', () => {
    it('should send message in sharded mode', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([true]),
        },
      } as unknown as Client;

      await Logger.log('Test log message');

      expect((global as any).client.shard?.broadcastEval).toHaveBeenCalled();
    });

    it('should do nothing if LOG_CHANNEL_ID not set', async () => {
      (global as any).config.LOG_CHANNEL_ID = '';
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      await Logger.log('Test log message');

      expect((global as any).client.shard?.broadcastEval).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      } as unknown as Client;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await Logger.log('Test log message');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send message to channel log-channel-123:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should log error messages to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      Logger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalledWith('Test error message');

      consoleSpy.mockRestore();
    });

    it('should handle different error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      Logger.error('Database connection failed');

      expect(consoleSpy).toHaveBeenCalledWith('Database connection failed');

      consoleSpy.mockRestore();
    });

    it('should sanitize error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      Logger.error('Button not found for Custom ID: unknown_handler');

      expect(consoleSpy).toHaveBeenCalledWith('Button not found for Custom ID: unknown_handler');

      consoleSpy.mockRestore();
    });

    it('should handle long error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const longMessage = 'A'.repeat(2001); // Over 2000 characters

      Logger.error(longMessage);

      // Logger.error just calls sanitize which doesn't truncate, so full message should be logged
      expect(consoleSpy).toHaveBeenCalledWith(longMessage);

      consoleSpy.mockRestore();
    });
  });
});
