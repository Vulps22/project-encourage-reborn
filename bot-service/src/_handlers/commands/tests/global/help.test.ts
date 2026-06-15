import { ChatInputCommandInteraction } from 'discord.js';
import { BotCommandInteraction } from '@vulps22/bot-interactions';
import helpView from '../../../../views/util/helpView';
import help from '../../global/help';

// Mock the helpView
jest.mock('../../../../views/util/helpView', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('help command', () => {
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

  it('should have correct command name', () => {
    expect(help.name).toBe('help');
  });

  it('should not be NSFW', () => {
    expect(help.isNSFW).toBe(false);
  });

  it('should not require administrator', () => {
    expect(help.isAdministrator).toBe(false);
  });

  it('should call helpView to build the message', async () => {
    const mockMessage = {
      flags: 1,
      components: [],
    };
    (helpView as jest.Mock).mockReturnValue(mockMessage);

    await help.execute(botInteraction);

    expect(helpView).toHaveBeenCalled();
  });

  it('should send reply with helpView message', async () => {
    const mockMessage = {
      flags: 1,
      components: [],
    };
    (helpView as jest.Mock).mockReturnValue(mockMessage);

    await help.execute(botInteraction);

    // sendReply will call either reply or editReply depending on deferred state
    const replyCall = mockInteraction.reply.mock.calls[0];
    expect(replyCall).toBeDefined();
    expect(replyCall[0]).toMatchObject({
      flags: 1,
      components: [],
    });
  });
});
