import { ButtonInteraction, PermissionsBitField } from 'discord.js';
import { serverService } from '../../../../services';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { channelSelectView } from '../../../../views';
import acceptRulesButton from '../../setup/acceptRules';

jest.mock('../../../../services', () => ({
  serverService: {
    acceptRules: jest.fn(),
    isServerBanned: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('../../../../views', () => ({
  channelSelectView: jest.fn(),
}));

describe('acceptRules button', () => {
  let mockInteraction: any;
  let botInteraction: BotButtonInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      customId: 'setup_acceptRules',
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

  it('should accept rules for admin users', async () => {
    const mockMessage = { components: [] };
    (channelSelectView as jest.Mock).mockReturnValue(mockMessage);
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await acceptRulesButton.execute(botInteraction);

    expect(serverService.acceptRules).toHaveBeenCalledWith('987654321');
    expect(channelSelectView).toHaveBeenCalled();
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockMessage);
  });

  it('should reject non-admin users', async () => {
    mockInteraction.member.permissions = new PermissionsBitField([]);
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await acceptRulesButton.execute(botInteraction);

    expect(serverService.acceptRules).not.toHaveBeenCalled();
    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ Only administrators can accept rules for this server.'
    );
  });

  it('should reject if no guild', async () => {
    mockInteraction.guildId = null;
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await acceptRulesButton.execute(botInteraction);

    expect(serverService.acceptRules).not.toHaveBeenCalled();
    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ This can only be used in a server.'
    );
  });

  it('should reject if server is banned', async () => {
    (serverService.isServerBanned as jest.Mock).mockResolvedValue('Hate Speech');
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await acceptRulesButton.execute(botInteraction);

    expect(serverService.acceptRules).not.toHaveBeenCalled();
    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ This server is banned from using the bot. Reason: Hate Speech'
    );
  });

  it('should have correct handler properties', () => {
    expect(acceptRulesButton.name).toBe('acceptRules');
    expect(acceptRulesButton.params).toEqual({});
  });
});
