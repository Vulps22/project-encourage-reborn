import { ButtonInteraction, PermissionsBitField } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import declineTermsButton from '../../setup/declineTerms';

describe('declineTerms button', () => {
  let mockInteraction: any;
  let botInteraction: BotButtonInteraction;
  let mockGuild: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGuild = {
      leave: jest.fn().mockResolvedValue(undefined),
    };

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      customId: 'setup_declineTerms',
      user: { id: '123456789' },
      guildId: '987654321',
      guild: mockGuild,
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

  it('should leave server when admin declines terms', async () => {
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await declineTermsButton.execute(botInteraction);

    expect(botInteraction.sendReply).toHaveBeenCalledWith(
      '👋 Terms declined. The bot will now leave this server. You can re-add the bot at any time if you change your mind.'
    );
    expect(mockGuild.leave).toHaveBeenCalled();
  });

  it('should reject non-admin users', async () => {
    mockInteraction.member.permissions = new PermissionsBitField([]);
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await declineTermsButton.execute(botInteraction);

    expect(mockGuild.leave).not.toHaveBeenCalled();
    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ Only administrators can decline terms for this server.'
    );
  });

  it('should reject if no guild', async () => {
    mockInteraction.guild = null;
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await declineTermsButton.execute(botInteraction);

    expect(mockGuild.leave).not.toHaveBeenCalled();
    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ This can only be used in a server.'
    );
  });

  it('should have correct handler properties', () => {
    expect(declineTermsButton.name).toBe('declineTerms');
    expect(declineTermsButton.params).toEqual({});
  });
});
