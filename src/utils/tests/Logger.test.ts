import { BaseInteraction, Client } from 'discord.js';
import { Logger } from '../Logger';

describe('Logger', () => {
  let mockInteraction: any;
  let originalEnv: NodeJS.ProcessEnv;
  let originalClient: Client;

  beforeEach(() => {
    originalEnv = process.env;
    originalClient = global.client;

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

    process.env = { ...originalEnv, LOG_CHANNEL_ID: 'log-channel-123' };

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.client = originalClient;
  });

  describe('logInteractionReceived', () => {
    it('should log interaction in sharded mode', async () => {
      global.client = {
        shard: {
          broadcastEval: jest.fn()
            .mockResolvedValueOnce([{ found: true, shardId: 0 }])
            .mockResolvedValueOnce(['msg-456', null]),
        },
      } as unknown as Client;

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect(global.client.shard?.broadcastEval).toHaveBeenCalledTimes(2);
      expect(executionId).toBe('msg-456');
    });

    it('should return empty string if LOG_CHANNEL_ID not set', async () => {
      delete process.env.LOG_CHANNEL_ID;
      global.client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect(executionId).toBe('');
    });

    it('should return empty string if channel not found in sharded mode', async () => {
      global.client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([{ found: false, shardId: 0 }]),
        },
      } as unknown as Client;

      const executionId = await Logger.logInteractionReceived(mockInteraction);

      expect(executionId).toBe('');
    });

    it('should handle errors gracefully', async () => {
      global.client = {
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
      global.client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([true]),
        },
      } as unknown as Client;

      await Logger.updateExecution('msg-123', 'Updated message');

      expect(global.client.shard?.broadcastEval).toHaveBeenCalled();
    });

    it('should do nothing if executionId is empty', async () => {
      global.client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      await Logger.updateExecution('', 'Updated message');
    });

    it('should do nothing if LOG_CHANNEL_ID not set', async () => {
      delete process.env.LOG_CHANNEL_ID;
      global.client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      await Logger.updateExecution('msg-123', 'Updated message');

      expect(global.client.shard?.broadcastEval).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      global.client = {
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
      global.client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([true]),
        },
      } as unknown as Client;

      await Logger.log('Test log message');

      expect(global.client.shard?.broadcastEval).toHaveBeenCalled();
    });

    it('should do nothing if LOG_CHANNEL_ID not set', async () => {
      delete process.env.LOG_CHANNEL_ID;
      global.client = {
        shard: {
          broadcastEval: jest.fn(),
        },
      } as unknown as Client;

      await Logger.log('Test log message');

      expect(global.client.shard?.broadcastEval).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      global.client = {
        shard: {
          broadcastEval: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      } as unknown as Client;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await Logger.log('Test log message');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send log message:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
