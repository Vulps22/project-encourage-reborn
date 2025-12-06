import { ChatInputCommandInteraction } from 'discord.js';
import { questionService } from '../../../services';
import { BotCommandInteraction } from '../../../structures';
import { QuestionType } from '../../../types';
import { questionEmbed } from '../../../views';
import truth from '../global/truth';

// Mock services and views
jest.mock('../../../services', () => ({
  questionService: {
    getRandomQuestion: jest.fn(),
  },
}));

jest.mock('../../../views', () => ({
  questionEmbed: jest.fn(),
}));

describe('truth command', () => {
  let mockInteraction: any;
  let botInteraction: BotCommandInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      deferReply: jest.fn().mockResolvedValue(undefined),
      user: { id: '123456789' },
      guildId: '987654321',
      channelId: '111222333',
      options: {
        getString: jest.fn(),
      },
    };

    botInteraction = new BotCommandInteraction(
      mockInteraction as ChatInputCommandInteraction,
      'test-execution-id'
    );
  });

  it('should send a random approved truth question', async () => {
    const mockQuestion = {
      id: 1,
      type: QuestionType.Truth,
      question: 'What is your biggest secret?',
      user_id: '999888777',
      is_approved: true,
      approved_by: '111222333',
      datetime_approved: new Date(),
      is_banned: false,
      ban_reason: null,
      banned_by: null,
      datetime_banned: null,
      created: new Date(),
      server_id: '987654321',
      message_id: null,
      is_deleted: false,
      datetime_deleted: null,
    };

    const mockEmbedMessage = {
      content: { type: 'container', children: [] },
      components: [],
    };

    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(mockQuestion);
    (questionEmbed as jest.Mock).mockReturnValue(mockEmbedMessage);

    // Mock the deferred state
    Object.defineProperty(botInteraction, 'deferred', { get: () => true });

    await truth.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Truth);
    expect(questionEmbed).toHaveBeenCalledWith(mockQuestion);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(mockEmbedMessage);
  });

  it('should handle no approved questions available', async () => {
    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(null);

    await truth.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Truth);
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: '❌ No approved truth questions available. Try again later!',
    });
  });

  it('should have correct command properties', () => {
    expect(truth.name).toBe('truth');
    expect(truth.isNSFW).toBe(true);
    expect(truth.isAdministrator).toBe(false);
  });
});
