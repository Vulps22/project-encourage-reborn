import { BotCommandInteraction } from '../../../structures';
import { questionService } from '../../../services';
import { confirmNewQuestionEmbed } from '../../../views';
import create from '../../global/create';
import { QuestionType } from '../../../types';

// Mock dependencies
jest.mock('../../../services', () => ({
  questionService: {
    createQuestion: jest.fn(),
  },
}));

jest.mock('../../../views', () => ({
  confirmNewQuestionEmbed: jest.fn(),
}));

describe('create command', () => {
  let mockInteraction: Partial<BotCommandInteraction>;
  let mockDeferReply: jest.Mock;
  let mockEditReply: jest.Mock;
  let mockSendReply: jest.Mock;
  let mockGetString: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDeferReply = jest.fn().mockResolvedValue(undefined);
    mockEditReply = jest.fn().mockResolvedValue(undefined);
    mockSendReply = jest.fn().mockResolvedValue(undefined);
    mockGetString = jest.fn();

    mockInteraction = {
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      sendReply: mockSendReply,
      guildId: '123456789012345678',
      user: {
        id: '987654321098765432',
      } as any,
      options: {
        getString: mockGetString,
      } as any,
    };
  });

  describe('command definition', () => {
    it('should have correct name', () => {
      expect(create.name).toBe('create');
    });

    it('should be marked as NSFW', () => {
      expect(create.isNSFW).toBe(true);
    });

    it('should not require administrator', () => {
      expect(create.isAdministrator).toBe(false);
    });

    it('should have valid JSON structure', () => {
      const json = create.toJSON();
      
      expect(json).toHaveProperty('name', 'create');
      expect(json).toHaveProperty('description');
      expect(json).toHaveProperty('options');
      expect(json.options).toHaveLength(2);
    });

    it('should have type and question options', () => {
      const json = create.toJSON();
      
      const typeOption = json.options.find((opt: any) => opt.name === 'type');
      const questionOption = json.options.find((opt: any) => opt.name === 'question');
      
      expect(typeOption).toBeDefined();
      expect(typeOption.required).toBe(true);
      expect(typeOption.choices).toHaveLength(2);
      
      expect(questionOption).toBeDefined();
      expect(questionOption.required).toBe(true);
      expect(questionOption.max_length).toBe(500);
    });
  });

  describe('execution', () => {
    it('should defer reply with ephemeral flag', async () => {
      mockGetString.mockReturnValueOnce('truth').mockReturnValueOnce('Test question');
      (questionService.createQuestion as jest.Mock).mockResolvedValue({
        id: 1,
        type: QuestionType.Truth,
        question: 'Test question',
        user_id: '987654321098765432',
        server_id: '123456789012345678',
      });
      (confirmNewQuestionEmbed as jest.Mock).mockReturnValue({ content: 'Success' });

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(mockDeferReply).toHaveBeenCalledWith({ ephemeral: true });
    });

    it('should fail if not in a guild', async () => {
      const noGuildInteraction = {
        ...mockInteraction,
        guildId: null,
      };

      await create.execute(noGuildInteraction as BotCommandInteraction);

      expect(mockEditReply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in a server.',
      });
    });

    it('should get type and question from options', async () => {
      mockGetString.mockReturnValueOnce('truth').mockReturnValueOnce('Test question');
      (questionService.createQuestion as jest.Mock).mockResolvedValue({
        id: 1,
        type: QuestionType.Truth,
        question: 'Test question',
      });
      (confirmNewQuestionEmbed as jest.Mock).mockReturnValue({ content: 'Success' });

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(mockGetString).toHaveBeenCalledWith('type', true);
      expect(mockGetString).toHaveBeenCalledWith('question', true);
    });

    it('should call questionService.createQuestion with correct parameters', async () => {
      mockGetString.mockReturnValueOnce('dare').mockReturnValueOnce('Do 20 pushups');
      (questionService.createQuestion as jest.Mock).mockResolvedValue({
        id: 2,
        type: QuestionType.Dare,
        question: 'Do 20 pushups',
      });
      (confirmNewQuestionEmbed as jest.Mock).mockReturnValue({ content: 'Success' });

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(questionService.createQuestion).toHaveBeenCalledWith(
        'dare',
        'Do 20 pushups',
        '987654321098765432',
        '123456789012345678'
      );
    });

    it('should handle validation error from service', async () => {
      mockGetString.mockReturnValueOnce('truth').mockReturnValueOnce('abc');
      (questionService.createQuestion as jest.Mock).mockResolvedValue(
        'Question must be between 5 and 500 characters long.'
      );

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(mockEditReply).toHaveBeenCalledWith({
        content: '❌ Question must be between 5 and 500 characters long.',
      });
      expect(mockSendReply).not.toHaveBeenCalled();
    });

    it('should send success message on valid question', async () => {
      const savedQuestion = {
        id: 1,
        type: QuestionType.Truth,
        question: 'Test question',
        user_id: '987654321098765432',
        server_id: '123456789012345678',
        is_approved: false,
        approved_by: null,
        datetime_approved: null,
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        datetime_banned: null,
        created: new Date(),
        message_id: null,
        is_deleted: false,
        datetime_deleted: null,
      };
      const embedResponse = { content: 'Success embed' };

      mockGetString.mockReturnValueOnce('truth').mockReturnValueOnce('Test question');
      (questionService.createQuestion as jest.Mock).mockResolvedValue(savedQuestion);
      (confirmNewQuestionEmbed as jest.Mock).mockReturnValue(embedResponse);

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(confirmNewQuestionEmbed).toHaveBeenCalledWith(savedQuestion);
      expect(mockSendReply).toHaveBeenCalledWith(null, embedResponse);
    });

    it('should handle truth type', async () => {
      mockGetString.mockReturnValueOnce('truth').mockReturnValueOnce('Test truth');
      (questionService.createQuestion as jest.Mock).mockResolvedValue({
        id: 1,
        type: QuestionType.Truth,
        question: 'Test truth',
      });
      (confirmNewQuestionEmbed as jest.Mock).mockReturnValue({ content: 'Success' });

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(questionService.createQuestion).toHaveBeenCalledWith(
        'truth',
        'Test truth',
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle dare type', async () => {
      mockGetString.mockReturnValueOnce('dare').mockReturnValueOnce('Test dare');
      (questionService.createQuestion as jest.Mock).mockResolvedValue({
        id: 1,
        type: QuestionType.Dare,
        question: 'Test dare',
      });
      (confirmNewQuestionEmbed as jest.Mock).mockReturnValue({ content: 'Success' });

      await create.execute(mockInteraction as BotCommandInteraction);

      expect(questionService.createQuestion).toHaveBeenCalledWith(
        'dare',
        'Test dare',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      mockGetString.mockReturnValueOnce('truth').mockReturnValueOnce('Test question');
      (questionService.createQuestion as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(create.execute(mockInteraction as BotCommandInteraction)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle missing guildId before calling service', async () => {
      const noGuildInteraction = {
        ...mockInteraction,
        guildId: undefined,
      } as unknown as BotCommandInteraction;

      await create.execute(noGuildInteraction);

      expect(questionService.createQuestion).not.toHaveBeenCalled();
      expect(mockEditReply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in a server.',
      });
    });
  });
});
