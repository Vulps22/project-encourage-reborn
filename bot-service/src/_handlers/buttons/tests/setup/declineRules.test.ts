import { ButtonInteraction, PermissionsBitField } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { channelSelectView } from '../../../../views';
import declineRulesButton from '../../setup/declineRules';

jest.mock('../../../../views', () => ({
  channelSelectView: jest.fn(),
}));

describe('declineRules button', () => {
  let mockInteraction: any;
  let botInteraction: BotButtonInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      customId: 'setup_declineRules',
      user: { id: '123456789' },
      guildId: '987654321',
      guild: { id: '987654321' },
      channelId: '444555666',
      member: {
        permissions: new PermissionsBitField(['Administrator']),
      },
      deferred: false,
      replied: false,
      message: {},
    };

    botInteraction = new BotButtonInteraction(
      mockInteraction as ButtonInteraction,
      'test-execution-id'
    );
  });

  it('should proceed to channel selection for admin users', async () => {
    const mockMessage = { components: [] };
    (channelSelectView as jest.Mock).mockReturnValue(mockMessage);
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await declineRulesButton.execute(botInteraction);

    expect(channelSelectView).toHaveBeenCalled();
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockMessage);
  });

  it('should reject non-admin users', async () => {
    mockInteraction.member.permissions = new PermissionsBitField([]);
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await declineRulesButton.execute(botInteraction);

    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ Only administrators can decline rules for this server.'
    );
  });

  it('should have correct handler properties', () => {
    expect(declineRulesButton.name).toBe('declineRules');
    expect(declineRulesButton.params).toEqual({});
  });
});
