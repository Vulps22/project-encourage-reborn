import { ChatInputCommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import { BotCommandInteraction } from '../BotCommandInteraction';

describe('BotCommandInteraction', () => {
  let mockInteraction: any;
  let botInteraction: BotCommandInteraction;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    const mockOptions = {
      getString: jest.fn(),
      getInteger: jest.fn(),
    } as unknown as CommandInteractionOptionResolver;

    mockInteraction = {
      user: { id: 'user123', username: 'testuser' },
      deferred: false,
      replied: false,
      commandName: 'create',
      options: mockOptions,
      reply: jest.fn().mockResolvedValue({}),
      editReply: jest.fn().mockResolvedValue({}),
      deferReply: jest.fn().mockResolvedValue({}),
    };

    botInteraction = new BotCommandInteraction(mockInteraction as ChatInputCommandInteraction, executionId);
  });

  describe('Command-Specific Properties', () => {
    it('should proxy commandName property', () => {
      expect(botInteraction.commandName).toBe('create');
    });

    it('should proxy options property', () => {
      expect(botInteraction.options).toBe(mockInteraction.options);
    });
  });
});
