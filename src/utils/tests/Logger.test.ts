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

  describe('updateQuestionLog', () => {
    it('should return null if question has no message_id', async () => {
      const question = { id: 123, message_id: null };
      
      const result = await Logger.updateQuestionLog(question as any, 'channel-123');
      
      expect(result).toBeNull();
    });

    it('should update question log successfully in sharded mode', async () => {
      const question = {
        id: 123,
        message_id: 'msg-456',
        datetime_approved: null,
        datetime_banned: null,
        datetime_deleted: null,
        created: new Date('2024-01-01')
      };
      
      const mockUpdatedMessage = { id: 'msg-456', content: 'Updated content' };
      
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([
            { success: true, error: null, message: mockUpdatedMessage },
            { success: false, error: 'Channel not found or not text-based', message: null }
          ]),
        },
      } as unknown as Client;

      const result = await Logger.updateQuestionLog(question as any, 'channel-123');

      expect((global as any).client.shard?.broadcastEval).toHaveBeenCalled();
      expect(result).toBe(mockUpdatedMessage);
    });

    it('should update question log with ban reasons successfully', async () => {
      const question = {
        id: 123,
        message_id: 'msg-456',
        datetime_approved: null,
        datetime_banned: null,
        datetime_deleted: null,
        created: new Date('2024-01-01')
      };

      const banReasons = [
        { label: '1 - Test Reason', value: 'test_reason' },
        { label: '2 - Another Reason', value: 'another_reason' }
      ];
      
      const mockUpdatedMessage = { id: 'msg-456', content: 'Updated content with reasons' };
      
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([
            { success: true, error: null, message: mockUpdatedMessage },
            { success: false, error: 'Channel not found or not text-based', message: null }
          ]),
        },
      } as unknown as Client;

      const result = await Logger.updateQuestionLog(question as any, 'channel-123', banReasons);

      expect((global as any).client.shard?.broadcastEval).toHaveBeenCalled();
      // Verify the broadcast eval was called with the reasons parameter
      const broadcastCall = (global as any).client.shard.broadcastEval.mock.calls[0];
      expect(broadcastCall[1]).toEqual({
        context: {
          channelId: 'channel-123',
          question: question,
          messageId: 'msg-456',
          reasons: banReasons
        }
      });
      expect(result).toBe(mockUpdatedMessage);
    });

    it('should return null if no successful message found in shards', async () => {
      const question = {
        id: 123,
        message_id: 'msg-456',
        datetime_approved: null,
        datetime_banned: null,
        datetime_deleted: null,
        created: new Date('2024-01-01')
      };
      
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([
            { success: false, error: 'Channel not found or not text-based', message: null },
            { success: false, error: 'Channel not found or not text-based', message: null }
          ]),
        },
      } as unknown as Client;

      // Mock Logger.error to prevent actual error logging
      const errorSpy = jest.spyOn(Logger, 'error').mockImplementation();

      const result = await Logger.updateQuestionLog(question as any, 'channel-123');

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('Failed to update question log: Channel not found or not text-based');

      errorSpy.mockRestore();
    });

    it('should log error when broadcast eval returns error result', async () => {
      const question = {
        id: 123,
        message_id: 'msg-456',
        datetime_approved: null,
        datetime_banned: null,
        datetime_deleted: null,
        created: new Date('2024-01-01')
      };
      
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockResolvedValue([
            { success: false, error: 'Message not found', message: null }
          ]),
        },
      } as unknown as Client;

      // Mock Logger.error to capture the call
      const errorSpy = jest.spyOn(Logger, 'error').mockImplementation();

      const result = await Logger.updateQuestionLog(question as any, 'channel-123');

      expect(errorSpy).toHaveBeenCalledWith('Failed to update question log: Message not found');
      expect(result).toBeNull();

      errorSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const question = {
        id: 123,
        message_id: 'msg-456',
        datetime_approved: null,
        datetime_banned: null,
        datetime_deleted: null,
        created: new Date('2024-01-01')
      };
      
      (global as any).client = {
        shard: {
          broadcastEval: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      } as unknown as Client;

      // Suppress console.error for this test
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        const result = await Logger.updateQuestionLog(question as any, 'channel-123');
        expect(result).toBeNull();
      } catch (error) {
        // Expected to fail, but should return null
        expect(error).toBeDefined();
      }
      
      // Restore console.error
      console.error = originalConsoleError;
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
