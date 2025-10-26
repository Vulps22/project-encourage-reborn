import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '../BotButtonInteraction';

describe('BotButtonInteraction', () => {
  let mockInteraction: any;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockInteraction = {
      user: { id: 'user123', username: 'testuser' },
      customId: '',
      deferred: false,
      replied: false,
      reply: jest.fn().mockResolvedValue({}),
      editReply: jest.fn().mockResolvedValue({}),
      deferReply: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };
  });

  describe('CustomId Parsing', () => {
    it('should parse simple customId with action', () => {
      mockInteraction.customId = 'vote_done';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('vote_done');
      expect(botInteraction.action).toBe('done');
      expect(botInteraction.params.size).toBe(0);
    });

    it('should parse customId with single parameter', () => {
      mockInteraction.customId = 'vote_done_msgId:12345';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('vote_done');
      expect(botInteraction.action).toBe('done');
      expect(botInteraction.params.get('msgId')).toBe('12345');
    });

    it('should parse customId with multiple parameters', () => {
      mockInteraction.customId = 'approve_question_id:67890_modId:11111';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('approve_question');
      expect(botInteraction.action).toBe('question');
      expect(botInteraction.params.get('id')).toBe('67890');
      expect(botInteraction.params.get('modId')).toBe('11111');
    });

    it('should handle customId with no parameters', () => {
      mockInteraction.customId = 'simple_button';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('simple_button');
      expect(botInteraction.action).toBe('button');
      expect(botInteraction.params.size).toBe(0);
    });

    it('should handle malformed customId', () => {
      mockInteraction.customId = 'malformed';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('malformed');
      expect(botInteraction.action).toBe('');
      expect(botInteraction.params.size).toBe(0);
    });

    it('should ignore invalid parameter format', () => {
      mockInteraction.customId = 'vote_done_invalidparam_msgId:12345';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('vote_done');
      expect(botInteraction.action).toBe('done');
      expect(botInteraction.params.get('msgId')).toBe('12345');
      expect(botInteraction.params.get('invalidparam')).toBeUndefined();
    });
  });

  describe('Button-Specific Properties', () => {
    it('should provide access to parsed properties', () => {
      mockInteraction.customId = 'test_action_key:value';
      const botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, executionId);

      expect(botInteraction.baseId).toBe('test_action');
      expect(botInteraction.action).toBe('action');
      expect(botInteraction.params).toBeInstanceOf(Map);
    });
  });
});
