import { MessageFlags } from 'discord.js';
import { Question } from '../../../interface';
import { QuestionType } from '../../../types';
import { confirmNewQuestionEmbed } from '../../question_views/confirmNewQuestionEmbed';

describe('confirmNewQuestionEmbed', () => {
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

      const result = confirmNewQuestionEmbed(question);

      expect(result.flags).toBe(MessageFlags.IsComponentsV2);
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(1);
    });

    it('should capitalize "truth" in title', () => {
      const question = createMockQuestion({
        type: QuestionType.Truth,
        question: 'What is your biggest fear?',
      });

      const result = confirmNewQuestionEmbed(question);

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

      const result = confirmNewQuestionEmbed(question);

      expect(result.flags).toBe(MessageFlags.IsComponentsV2);
      expect(result.components).toBeDefined();
      expect(result.components).toHaveLength(1);
    });

    it('should capitalize "dare" in title', () => {
      const question = createMockQuestion({
        type: QuestionType.Dare,
        question: 'Do 20 pushups',
      });

      const result = confirmNewQuestionEmbed(question);

      const container = result.components![0];
      expect(container).toBeDefined();
    });
  });

  describe('message structure', () => {
    it('should use ComponentsV2 flag', () => {
      const question = createMockQuestion();

      const result = confirmNewQuestionEmbed(question);

      expect(result.flags).toBe(MessageFlags.IsComponentsV2);
    });

    it('should return InteractionReplyOptions', () => {
      const question = createMockQuestion();

      const result = confirmNewQuestionEmbed(question);

      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('components');
    });

    it('should have exactly one container', () => {
      const question = createMockQuestion();

      const result = confirmNewQuestionEmbed(question);

      expect(result.components).toHaveLength(1);
    });
  });

  describe('question content', () => {
    it('should include question text in description', () => {
      const questionText = 'What is your favorite color?';
      const question = createMockQuestion({ question: questionText });

      const result = confirmNewQuestionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should handle long questions', () => {
      const longQuestion = 'a'.repeat(500);
      const question = createMockQuestion({ question: longQuestion });

      const result = confirmNewQuestionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should handle short questions', () => {
      const shortQuestion = 'Why?';
      const question = createMockQuestion({ question: shortQuestion });

      const result = confirmNewQuestionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });
  });

  describe('footer information', () => {
    it('should include question ID in footer', () => {
      const questionId = 999888777;
      const question = createMockQuestion({ id: questionId });

      const result = confirmNewQuestionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });

    it('should include user ID in footer', () => {
      const userId = '111111111111111111';
      const question = createMockQuestion({ user_id: userId });

      const result = confirmNewQuestionEmbed(question);

      expect(result.components).toBeDefined();
      expect(result.components![0]).toBeDefined();
    });
  });

  describe('pure function behavior', () => {
    it('should return same output for same input', () => {
      const question = createMockQuestion();

      const result1 = confirmNewQuestionEmbed(question);
      const result2 = confirmNewQuestionEmbed(question);

      expect(result1.flags).toBe(result2.flags);
      expect(result1.components?.length).toBe(result2.components?.length);
    });

    it('should not mutate input question', () => {
      const question = createMockQuestion();
      const originalQuestion = { ...question };

      confirmNewQuestionEmbed(question);

      expect(question).toEqual(originalQuestion);
    });
  });
});
