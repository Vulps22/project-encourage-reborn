import { ChatInputCommandInteraction, Collection, Interaction } from 'discord.js';
import { Logger, Command } from '../../utils';
import { BotCommandInteraction } from '../../structures';
import interactionCreate from '../interactionCreate';

// Extend global type for tests
declare global {
  var commands: Collection<string, Command>;
}

// Mock dependencies
jest.mock('../../utils', () => ({
  Logger: {
    logInteractionReceived: jest.fn(),
    updateExecution: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../structures', () => ({
  BotCommandInteraction: jest.fn(),
}));

describe('interactionCreate event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.commands = new Collection<string, Command>();
    (Logger.logInteractionReceived as jest.Mock).mockResolvedValue('execution-id-123');
  });

  describe('event metadata', () => {
    it('should have correct event name', () => {
      expect(interactionCreate.event).toBe('interactionCreate');
    });

    it('should not be a once event', () => {
      expect(interactionCreate.once).toBe(false);
    });
  });

  describe('chat input commands', () => {
    let mockInteraction: Partial<ChatInputCommandInteraction>;
    let mockCommand: any;
    let mockBotInteraction: any;

    beforeEach(() => {
      mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        commandName: 'testcommand',
      } as any;

      mockCommand = {
        execute: jest.fn().mockResolvedValue(undefined),
        isAdministrator: false,
      } as any;

      mockBotInteraction = {
        isAdministrator: jest.fn().mockReturnValue(false),
        sendReply: jest.fn().mockResolvedValue(undefined),
      };

      (BotCommandInteraction as jest.Mock).mockImplementation(() => mockBotInteraction);
    });

    it('should log interaction received', async () => {
      global.commands.set('testcommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(Logger.logInteractionReceived).toHaveBeenCalledWith(mockInteraction);
    });

    it('should get command from global.commands', async () => {
      global.commands.set('testcommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(mockCommand.execute).toHaveBeenCalled();
    });

    it('should create BotCommandInteraction with executionId', async () => {
      global.commands.set('testcommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(BotCommandInteraction).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
    });

    it('should execute command with BotCommandInteraction', async () => {
      global.commands.set('testcommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(mockCommand.execute).toHaveBeenCalledWith(mockBotInteraction);
    });

    it('should log error if command not found', async () => {
      // Don't add command to global.commands

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(Logger.error).toHaveBeenCalledWith('No command found for name: testcommand');
      expect(mockCommand.execute).not.toHaveBeenCalled();
    });

    it('should not execute if command not found', async () => {
      const executeSpy = jest.fn();
      mockCommand.execute = executeSpy;

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(executeSpy).not.toHaveBeenCalled();
    });
  });

  describe('administrator permission check', () => {
    let mockInteraction: Partial<ChatInputCommandInteraction>;
    let mockCommand: any;
    let mockBotInteraction: any;

    beforeEach(() => {
      mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        commandName: 'admincommand',
      } as any;

      mockCommand = {
        execute: jest.fn().mockResolvedValue(undefined),
        isAdministrator: true,
      } as any;

      mockBotInteraction = {
        isAdministrator: jest.fn(),
        sendReply: jest.fn().mockResolvedValue(undefined),
      };

      (BotCommandInteraction as jest.Mock).mockImplementation(() => mockBotInteraction);
    });

    it('should block non-admin users from admin commands', async () => {
      mockBotInteraction.isAdministrator.mockReturnValue(false);
      global.commands.set('admincommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(mockBotInteraction.sendReply).toHaveBeenCalledWith(
        '❌ You do not have permission to use this command.'
      );
      expect(mockCommand.execute).not.toHaveBeenCalled();
    });

    it('should allow admin users to use admin commands', async () => {
      mockBotInteraction.isAdministrator.mockReturnValue(true);
      global.commands.set('admincommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(mockBotInteraction.sendReply).not.toHaveBeenCalled();
      expect(mockCommand.execute).toHaveBeenCalledWith(mockBotInteraction);
    });

    it('should log permission denied for blocked users', async () => {
      mockBotInteraction.isAdministrator.mockReturnValue(false);
      global.commands.set('admincommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(Logger.updateExecution).toHaveBeenCalledWith(
        'execution-id-123',
        'Failed: Permission denied'
      );
    });

    it('should not check permissions for non-admin commands', async () => {
      mockCommand.isAdministrator = false;
      mockBotInteraction.isAdministrator.mockReturnValue(false);
      global.commands.set('admincommand', mockCommand);

      await interactionCreate.execute(mockInteraction as Interaction);

      expect(mockBotInteraction.sendReply).not.toHaveBeenCalled();
      expect(mockCommand.execute).toHaveBeenCalled();
    });
  });

  describe('non-command interactions', () => {
    it('should ignore non-chat-input interactions', async () => {
      const mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
      } as any;

      await interactionCreate.execute(mockInteraction);

      expect(Logger.logInteractionReceived).toHaveBeenCalledWith(mockInteraction);
      expect(BotCommandInteraction).not.toHaveBeenCalled();
    });

    it('should log button interactions but not process', async () => {
      const mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(true),
      } as any;

      await interactionCreate.execute(mockInteraction);

      expect(Logger.logInteractionReceived).toHaveBeenCalled();
      expect(BotCommandInteraction).not.toHaveBeenCalled();
    });

    it('should log select menu interactions but not process', async () => {
      const mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(false),
        isStringSelectMenu: jest.fn().mockReturnValue(true),
      } as any;

      await interactionCreate.execute(mockInteraction);

      expect(Logger.logInteractionReceived).toHaveBeenCalled();
      expect(BotCommandInteraction).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should call command execute without awaiting', async () => {
      const mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        commandName: 'testcommand',
      } as any;

      const mockCommand = {
        execute: jest.fn().mockResolvedValue(undefined),
        isAdministrator: false,
      } as any;

      const mockBotInteraction = {
        isAdministrator: jest.fn().mockReturnValue(false),
      };

      (BotCommandInteraction as jest.Mock).mockImplementation(() => mockBotInteraction);
      global.commands.set('testcommand', mockCommand);

      // Event handler returns immediately without awaiting command.execute()
      await interactionCreate.execute(mockInteraction as Interaction);

      expect(mockCommand.execute).toHaveBeenCalled();
      // The promise is not awaited, so we return before it resolves
    });

    it('should handle missing global.commands', async () => {
      const mockInteraction = {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        commandName: 'testcommand',
      } as any;

      // @ts-ignore - testing edge case
      global.commands = undefined;

      await expect(interactionCreate.execute(mockInteraction as Interaction)).rejects.toThrow();
    });
  });
});
