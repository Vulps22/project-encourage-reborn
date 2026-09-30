import { ChatInputCommandInteraction } from 'discord.js';
import { challengeService, questionService, votingService } from '../../../../services';
import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { QuestionType } from '@vulps22/project-encourage-types';
import { challengeEmbed } from '../../../../views';
import dare from '../../global/dare';

// Mock services and views
jest.mock('../../../../services', () => ({
  questionService: {
    getRandomQuestion: jest.fn(),
  },
  challengeService: {
    createChallenge: jest.fn().mockResolvedValue({ id: 1 }),
    setMessageId: jest.fn().mockResolvedValue(undefined),
  },
  votingService: {
    addChallenge: jest.fn().mockResolvedValue({ challenge_id: 1, done_count: 0, failed_count: 0, final_result: null, finalised_datetime: null }),
  },
}));

jest.mock('../../../../views', () => ({
  challengeEmbed: jest.fn(),
}));

describe('dare command', () => {
  let mockInteraction: any;
  let botInteraction: BotCommandInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    (challengeService.createChallenge as jest.Mock).mockResolvedValue({ id: 1 });
    (challengeService.setMessageId as jest.Mock).mockResolvedValue(undefined);
    (votingService.addChallenge as jest.Mock).mockResolvedValue({ challenge_id: 1, done_count: 0, failed_count: 0, final_result: null, finalised_datetime: null });

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
    (challengeEmbed as jest.Mock).mockReturnValue(mockEmbedMessage);

    // Mock sendReply method
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await dare.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Dare);
    expect(challengeEmbed).toHaveBeenCalled();
    expect(botInteraction.sendReply).toHaveBeenCalledWith(mockEmbedMessage);
  });

  it('should handle no approved questions available', async () => {
    (questionService.getRandomQuestion as jest.Mock).mockResolvedValue(null);
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await dare.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(questionService.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Dare);
    expect(botInteraction.sendReply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: expect.any(Number) })
    );
  });

  it('should have correct command properties', () => {
    expect(dare.name).toBe('dare');
    expect(dare.isNSFW).toBe(true);
    expect(dare.isAdministrator).toBe(false);
    expect(dare.interactionInitiator).toBe(true);
  });
});
