import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { BotCommandInteraction } from '../../../../structures';
import { rulesView } from '../../../../views/setup/rulesView';
import rules from '../../global/rules';

// Mock rulesView (named export)
jest.mock('../../../../views/setup/rulesView', () => ({
  rulesView: jest.fn(),
}));

describe('rules command', () => {
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
    expect(rules.name).toBe('rules');
  });

  it('should not be NSFW', () => {
    expect(rules.isNSFW).toBe(false);
  });

  it('should not require administrator', () => {
    expect(rules.isAdministrator).toBe(false);
  });

  it('should defer reply as ephemeral', async () => {
    (rulesView as jest.Mock).mockReturnValue({ flags: MessageFlags.IsComponentsV2, components: [] });

    await rules.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
  });

  it('should call rulesView with showButtons=false', async () => {
    (rulesView as jest.Mock).mockReturnValue({ flags: MessageFlags.IsComponentsV2, components: [] });

    await rules.execute(botInteraction);

    expect(rulesView).toHaveBeenCalledWith(false);
  });

  it('should send reply with rulesView message', async () => {
    const mockMessage = { flags: MessageFlags.IsComponentsV2, components: [{}] };
    (rulesView as jest.Mock).mockReturnValue(mockMessage);
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await rules.execute(botInteraction);

    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockMessage);
  });
});
