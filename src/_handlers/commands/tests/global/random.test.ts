import { ChatInputCommandInteraction } from 'discord.js';
import { questionService } from '../../../../services';
import { BotCommandInteraction } from '../../../../structures';
import { QuestionType } from '../../../../types';
import { questionEmbed } from '../../../../views';
import random from '../../global/random';

// Mock services and views
jest.mock('../../../../services', () => ({
  questionService: {
    getRandomQuestion: jest.fn(),
  },
  votingService: {
    createVoteTracking: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../../../views', () => ({
  questionEmbed: jest.fn(),
}));

describe('random command', () => {
  let mockInteraction: any;
  let botInteraction: BotCommandInteraction;
  let mathRandomSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      deferReply: jest.fn().mockResolvedValue(undefined),
      fetchReply: jest.fn().mockResolvedValue({ id: 'mock-message-id' }),
      user: { id: '123456789', username: 'testuser' },
      guildId: '987654321',
      channelId: '111222333',
      channel: { id: '111222333' },
      options: {
        getString: jest.fn(),
      },
    };

    botInteraction = new BotCommandInteraction(
      mockInteraction as ChatInputCommandInteraction,
      'test-execution-id'
    );

    // Create spy for Math.random
    mathRandomSpy = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  it('should send a random truth question when Math.random < 0.5', async () => {
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

    // Mock Math.random to return value < 0.5 (should select Truth)
    mathRandomSpy.mockReturnValue(0.3);

    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(mockQuestion);
    (questionEmbed as jest.Mock).mockReturnValue(mockEmbedMessage);

    // Mock sendReply method
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await random.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Truth);
    expect(questionEmbed).toHaveBeenCalledWith(mockQuestion);
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockEmbedMessage);
  });

  it('should send a random dare question when Math.random >= 0.5', async () => {
    const mockQuestion = {
      id: 2,
      type: QuestionType.Dare,
      question: 'Do 10 pushups',
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

    // Mock Math.random to return value >= 0.5 (should select Dare)
    mathRandomSpy.mockReturnValue(0.7);

    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(mockQuestion);
    (questionEmbed as jest.Mock).mockReturnValue(mockEmbedMessage);

    // Mock sendReply method
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await random.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Dare);
    expect(questionEmbed).toHaveBeenCalledWith(mockQuestion);
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockEmbedMessage);
  });

  it('should handle no approved truth questions available', async () => {
    // Mock Math.random to select Truth
    mathRandomSpy.mockReturnValue(0.3);

    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(null);

    await random.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Truth);
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: '❌ No approved truth questions available. Try again later!',
    });
  });

  it('should handle no approved dare questions available', async () => {
    // Mock Math.random to select Dare
    mathRandomSpy.mockReturnValue(0.7);

    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(null);

    await random.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Dare);
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: '❌ No approved dare questions available. Try again later!',
    });
  });

  it('should have correct command properties', () => {
    expect(random.name).toBe('random');
    expect(random.isNSFW).toBe(true);
    expect(random.isAdministrator).toBe(false);
  });
});
