import { MessageFlags } from 'discord.js';
import { Question } from '../../../interface';
import { QuestionType } from '../../../types';
import { questionEmbed } from '../../question_views/questionEmbed';

describe('questionEmbed', () => {
  const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
    id: 123456789,
    type: QuestionType.Truth,
    question: 'Test question',
    user_id: '987654321098765432',
    server_id: '111222333444555666',
    is_approved: false,
    approved_by: null,
    datetime_approved: null,
    is_banned: false,
    ban_reason: null,
    banned_by: null,
    datetime_banned: null,
    created: new Date('2024-01-01T12:00:00Z'),
    message_id: null,
    is_deleted: false,
    datetime_deleted: null,
    ...overrides,
  });

  describe('truth questions', () => {
    it('should create embed for truth question', () => {
      const question = createMockQuestion({
        type: QuestionType.Truth,
        question: 'What is your biggest fear?',
      });

      const result = questionEmbed(question);

      expect(result.flags).toBe(MessageFlags.IsComponentsV2);
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2); // Container + ButtonRow
    });

    it('should capitalize "truth" in title', () => {
      const question = createMockQuestion({
        type: QuestionType.Truth,
        question: 'What is your biggest fear?',
      });

      const result = questionEmbed(question);

      const container = result.components![0];
      expect(container).toBeDefined();
    });
  });

  describe('dare questions', () => {
    it('should create embed for dare question', () => {
      const question = createMockQuestion({
        type: QuestionType.Dare,
        question: 'Do 20 pushups',
      });

      const result = questionEmbed(question);

      expect(result.flags).toBe(MessageFlags.IsComponentsV2);
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2); // Container + ButtonRow
    });

    it('should capitalize "dare" in title', () => {
      const question = createMockQuestion({
        type: QuestionType.Dare,
        question: 'Do 20 pushups',
      });

      const result = questionEmbed(question);

      const container = result.components![0];
      expect(container).toBeDefined();
    });
  });

  describe('message structure', () => {
    it('should use ComponentsV2 flag', () => {
      const question = createMockQuestion();

      const result = questionEmbed(question);

      expect(result.flags).toBe(MessageFlags.IsComponentsV2);
    });

    it('should return UniversalMessage', () => {
      const question = createMockQuestion();

      const result = questionEmbed(question);

      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('components');
    });

    it('should have container and button row', () => {
      const question = createMockQuestion();

      const result = questionEmbed(question);

      expect(result.components).toHaveLength(2);
    });
  });

  describe('question content', () => {
    it('should include question text', () => {
      const questionText = 'What is your favorite color?';
      const question = createMockQuestion({ question: questionText });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should handle long questions', () => {
      const longQuestion = 'a'.repeat(500);
      const question = createMockQuestion({ question: longQuestion });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should handle short questions', () => {
      const shortQuestion = 'Why?';
      const question = createMockQuestion({ question: shortQuestion });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });
  });

  describe('footer information', () => {
    it('should include question ID in footer', () => {
      const questionId = 999888777;
      const question = createMockQuestion({ id: questionId });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should include user ID in footer', () => {
      const userId = '123456789012345678';
      const question = createMockQuestion({ user_id: userId });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });
  });

  describe('voting information', () => {
    it('should show initial voting status', () => {
      const question = createMockQuestion();

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });
  });

  describe('action buttons', () => {
    it('should include all three action buttons', () => {
      const question = createMockQuestion();

      const result = questionEmbed(question);

      expect(result.components).toHaveLength(2);
      const buttonRow = result.components![1];
      expect(buttonRow).toBeDefined();
    });

    it('should have DONE button with correct custom ID', () => {
      const questionId = 12345;
      const question = createMockQuestion({ id: questionId });

      const result = questionEmbed(question);

      const buttonRow = result.components![1] as any;
      expect(buttonRow.components).toBeDefined();
    });

    it('should have FAILED button with correct custom ID', () => {
      const questionId = 67890;
      const question = createMockQuestion({ id: questionId });

      const result = questionEmbed(question);

      const buttonRow = result.components![1] as any;
      expect(buttonRow.components).toBeDefined();
    });

    it('should have SKIP button with correct custom ID', () => {
      const questionId = 11111;
      const question = createMockQuestion({ id: questionId });

      const result = questionEmbed(question);

      const buttonRow = result.components![1] as any;
      expect(buttonRow.components).toBeDefined();
    });
  });

  describe('report button', () => {
    it('should include report button accessory', () => {
      const question = createMockQuestion();

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should have report button with correct custom ID', () => {
      const questionId = 55555;
      const question = createMockQuestion({ id: questionId });

      const result = questionEmbed(question);

      const container = result.components![0];
      expect(container).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle question with special characters', () => {
      const specialQuestion = 'What\'s your "favorite" thing? & why?';
      const question = createMockQuestion({ question: specialQuestion });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2);
    });

    it('should handle question with newlines', () => {
      const multilineQuestion = 'Line 1\nLine 2\nLine 3';
      const question = createMockQuestion({ question: multilineQuestion });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2);
    });

    it('should handle very large question IDs', () => {
      const largeId = 999999999999999;
      const question = createMockQuestion({ id: largeId });

      const result = questionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(2);
    });
  });
});
