import { Interaction, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import { BotInteraction } from '../BotInteraction';
import { Logger } from '../../utils';

// Mock Logger
jest.mock('../../utils', () => ({
  Logger: {
    updateExecution: jest.fn().mockResolvedValue(undefined),
  },
}));

// Create a concrete test class since BotInteraction is abstract
class TestBotInteraction extends BotInteraction {
  constructor(interaction: Interaction, executionId: string) {
    super(interaction, executionId);
  }
}

describe('BotInteraction', () => {
  let mockInteraction: any;
  let botInteraction: TestBotInteraction;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      user: { id: 'user123', username: 'testuser' },
      member: {
        permissions: new PermissionsBitField(PermissionFlagsBits.Administrator),
      },
      channel: { id: 'channel123' },
      guild: { id: 'guild123', name: 'Test Guild' },
      client: {},
      id: 'interaction123',
      guildId: 'guild123',
    };

    botInteraction = new TestBotInteraction(mockInteraction, executionId);
  });

  describe('Common Properties', () => {
    it('should proxy user property', () => {
      expect(botInteraction.user).toBe(mockInteraction.user);
    });

    it('should proxy member property', () => {
      expect(botInteraction.member).toBe(mockInteraction.member);
    });

    it('should proxy channel property', () => {
      expect(botInteraction.channel).toBe(mockInteraction.channel);
    });

    it('should proxy guild property', () => {
      expect(botInteraction.guild).toBe(mockInteraction.guild);
    });

    it('should proxy client property', () => {
      expect(botInteraction.client).toBe(mockInteraction.client);
    });

    it('should proxy id property', () => {
      expect(botInteraction.id).toBe(mockInteraction.id);
    });

    it('should proxy guildId property', () => {
      expect(botInteraction.guildId).toBe(mockInteraction.guildId);
    });

    it('should return executionId', () => {
      expect(botInteraction.executionId).toBe(executionId);
    });
  });

  describe('isAdministrator', () => {
    it('should return true when member has Administrator permission', () => {
      expect(botInteraction.isAdministrator()).toBe(true);
    });

    it('should return false when member has no Administrator permission', () => {
      mockInteraction.member = {
        permissions: new PermissionsBitField(PermissionFlagsBits.SendMessages),
      };
      botInteraction = new TestBotInteraction(mockInteraction, executionId);

      expect(botInteraction.isAdministrator()).toBe(false);
    });

    it('should return false when member is null', () => {
      mockInteraction.member = null;
      botInteraction = new TestBotInteraction(mockInteraction, executionId);

      expect(botInteraction.isAdministrator()).toBe(false);
    });

    it('should return false when permissions is a string', () => {
      mockInteraction.member = {
        permissions: '8',
      };
      botInteraction = new TestBotInteraction(mockInteraction, executionId);

      expect(botInteraction.isAdministrator()).toBe(false);
    });
  });

  describe('updateLog', () => {
    it('should call Logger.updateExecution with correct parameters', async () => {
      const status = 'Test Status';
      await botInteraction.updateLog(status);

      expect(Logger.updateExecution).toHaveBeenCalledWith(executionId, status);
    });
  });
});
