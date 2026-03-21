import { ChatInputCommandInteraction } from 'discord.js';
import { questionService } from '../../../../services';
import { BotCommandInteraction } from '../../../../structures';
import { QuestionType } from '../../../../types';
import { questionEmbed } from '../../../../views';
import dare from '../../global/dare';

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

describe('dare command', () => {
  let mockInteraction: any;
  let botInteraction: BotCommandInteraction;

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
  });

  it('should send a random approved dare question', async () => {
    const mockQuestion = {
      id: 1,
      type: QuestionType.Dare,
      question: 'Do 10 jumping jacks.',
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

    // Mock sendReply method
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await dare.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Dare);
    expect(questionEmbed).toHaveBeenCalledWith(mockQuestion);
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockEmbedMessage);
  });

  it('should handle no approved questions available', async () => {
    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(null);

    await dare.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Dare);
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: '❌ No approved dare questions available. Try again later!',
    });
  });

  it('should have correct command properties', () => {
    expect(dare.name).toBe('dare');
    expect(dare.isNSFW).toBe(true);
    expect(dare.isAdministrator).toBe(false);
  });
});
