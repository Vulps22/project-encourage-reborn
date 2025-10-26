import { StringSelectMenuInteraction } from 'discord.js';
import { BotSelectMenuInteraction } from '../BotSelectMenuInteraction';

describe('BotSelectMenuInteraction', () => {
  let mockInteraction: any;
  const executionId = 'test-execution-id';

  beforeEach(() => {
    mockInteraction = {
      user: { id: 'user123', username: 'testuser' },
      customId: '',
      values: [],
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
      mockInteraction.customId = 'category_select';
      const botInteraction = new BotSelectMenuInteraction(mockInteraction as StringSelectMenuInteraction, executionId);

      expect(botInteraction.baseId).toBe('category_select');
      expect(botInteraction.action).toBe('select');
      expect(botInteraction.params.size).toBe(0);
    });

    it('should parse customId with parameters', () => {
      mockInteraction.customId = 'filter_questions_type:truth_page:1';
      const botInteraction = new BotSelectMenuInteraction(mockInteraction as StringSelectMenuInteraction, executionId);

      expect(botInteraction.baseId).toBe('filter_questions');
      expect(botInteraction.action).toBe('questions');
      expect(botInteraction.params.get('type')).toBe('truth');
      expect(botInteraction.params.get('page')).toBe('1');
    });
  });

  describe('Select Menu-Specific Properties', () => {
    it('should proxy values property', () => {
      mockInteraction.customId = 'test_menu';
      mockInteraction.values = ['option1', 'option2'];
      const botInteraction = new BotSelectMenuInteraction(mockInteraction as StringSelectMenuInteraction, executionId);

      expect(botInteraction.values).toEqual(['option1', 'option2']);
    });

    it('should provide access to parsed properties', () => {
      mockInteraction.customId = 'test_action_key:value';
      mockInteraction.values = ['selected'];
      const botInteraction = new BotSelectMenuInteraction(mockInteraction as StringSelectMenuInteraction, executionId);

      expect(botInteraction.baseId).toBe('test_action');
      expect(botInteraction.action).toBe('action');
      expect(botInteraction.params).toBeInstanceOf(Map);
      expect(botInteraction.values).toEqual(['selected']);
    });
  });
});
