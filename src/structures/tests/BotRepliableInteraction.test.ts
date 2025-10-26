import { ChatInputCommandInteraction, InteractionReplyOptions, MessageFlags } from 'discord.js';
import { BotRepliableInteraction } from '../BotRepliableInteraction';

// Create a concrete test class since BotRepliableInteraction is abstract
class TestBotRepliableInteraction extends BotRepliableInteraction {
  constructor(interaction: ChatInputCommandInteraction, executionId: string) {
    super(interaction, executionId);
  }
}

describe('BotRepliableInteraction', () => {
  let mockInteraction: any;
  let botInteraction: TestBotRepliableInteraction;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockInteraction = {
      user: { id: 'user123', username: 'testuser' },
      deferred: false,
      replied: false,
      reply: jest.fn().mockResolvedValue({}),
      editReply: jest.fn().mockResolvedValue({}),
      deferReply: jest.fn().mockResolvedValue({}),
    };

    botInteraction = new TestBotRepliableInteraction(mockInteraction, executionId);
  });

  describe('Repliable Properties', () => {
    it('should proxy deferred property', () => {
      expect(botInteraction.deferred).toBe(false);
      mockInteraction.deferred = true;
      expect(botInteraction.deferred).toBe(true);
    });

    it('should proxy replied property', () => {
      expect(botInteraction.replied).toBe(false);
      mockInteraction.replied = true;
      expect(botInteraction.replied).toBe(true);
    });
  });

  describe('reply', () => {
    it('should call underlying interaction reply', async () => {
      const options: InteractionReplyOptions = { content: 'Test' };
      await botInteraction.reply(options);

      expect(mockInteraction.reply).toHaveBeenCalledWith(options);
    });
  });

  describe('editReply', () => {
    it('should call underlying interaction editReply with string', async () => {
      await botInteraction.editReply('Updated message');

      expect(mockInteraction.editReply).toHaveBeenCalledWith('Updated message');
    });

    it('should call underlying interaction editReply with options', async () => {
      const options = { content: 'Updated' };
      await botInteraction.editReply(options);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(options);
    });
  });

  describe('deferReply', () => {
    it('should call underlying interaction deferReply', async () => {
      await botInteraction.deferReply({ ephemeral: true });

      expect(mockInteraction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    });
  });

  describe('sendReply', () => {
    it('should call reply when not deferred or replied', async () => {
      mockInteraction.deferred = false;
      mockInteraction.replied = false;

      await botInteraction.sendReply('Test message');

      expect(mockInteraction.reply).toHaveBeenCalledWith({ content: 'Test message' });
      expect(mockInteraction.editReply).not.toHaveBeenCalled();
    });

    it('should call editReply when deferred', async () => {
      mockInteraction.deferred = true;

      await botInteraction.sendReply('Test message');

      expect(mockInteraction.editReply).toHaveBeenCalledWith({ content: 'Test message' });
      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it('should call editReply when already replied', async () => {
      mockInteraction.replied = true;

      await botInteraction.sendReply('Test message');

      expect(mockInteraction.editReply).toHaveBeenCalledWith({ content: 'Test message' });
      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it('should merge content with existing options', async () => {
      await botInteraction.sendReply('Test', { embeds: [] });

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Test',
        embeds: [],
      });
    });

    it('should not add content if empty string', async () => {
      await botInteraction.sendReply('', { embeds: [] });

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        embeds: [],
      });
    });
  });

  describe('ephemeralReply', () => {
    it('should set ephemeral flag', async () => {
      await botInteraction.ephemeralReply('Test');

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Test',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should combine with existing flags', async () => {
      await botInteraction.ephemeralReply('Test', { flags: MessageFlags.SuppressEmbeds });

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Test',
        flags: MessageFlags.SuppressEmbeds | MessageFlags.Ephemeral,
      });
    });
  });
});
