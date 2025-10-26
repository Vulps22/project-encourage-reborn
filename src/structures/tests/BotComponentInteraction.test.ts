import { ButtonInteraction } from 'discord.js';
import { BotComponentInteraction } from '../BotComponentInteraction';

// Create a concrete test class since BotComponentInteraction is abstract
class TestBotComponentInteraction extends BotComponentInteraction {
  constructor(interaction: ButtonInteraction, executionId: string) {
    super(interaction, executionId);
  }
}

describe('BotComponentInteraction', () => {
  let mockInteraction: any;
  let botInteraction: TestBotComponentInteraction;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockInteraction = {
      user: { id: 'user123', username: 'testuser' },
      customId: 'vote_done_msgId:12345',
      deferred: false,
      replied: false,
      reply: jest.fn().mockResolvedValue({}),
      editReply: jest.fn().mockResolvedValue({}),
      deferReply: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };

    botInteraction = new TestBotComponentInteraction(mockInteraction as ButtonInteraction, executionId);
  });

  describe('Component-Specific Properties', () => {
    it('should proxy customId property', () => {
      expect(botInteraction.customId).toBe('vote_done_msgId:12345');
    });
  });

  describe('update', () => {
    it('should call underlying interaction update with string', async () => {
      await botInteraction.update('Updated');

      expect(mockInteraction.update).toHaveBeenCalledWith('Updated');
    });

    it('should call underlying interaction update with options', async () => {
      const options = { content: 'Updated', components: [] };
      await botInteraction.update(options);

      expect(mockInteraction.update).toHaveBeenCalledWith(options);
    });
  });
});
