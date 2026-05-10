import { ButtonInteraction, PermissionsBitField } from 'discord.js';
import { serverService } from '../../../../services';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import { rulesView } from '../../../../views';
import acceptTermsButton from '../../setup/acceptTerms';

jest.mock('../../../../services', () => ({
  serverService: {
    acceptTerms: jest.fn(),
  },
}));

jest.mock('../../../../views', () => ({
  rulesView: jest.fn(),
}));

describe('acceptTerms button', () => {
  let mockInteraction: any;
  let botInteraction: BotButtonInteraction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      customId: 'setup_acceptTerms',
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

  it('should accept terms for admin users', async () => {
    const mockMessage = { components: [] };
    (rulesView as jest.Mock).mockReturnValue(mockMessage);
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await acceptTermsButton.execute(botInteraction);

    expect(serverService.acceptTerms).toHaveBeenCalledWith('987654321');
    expect(rulesView).toHaveBeenCalled();
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockMessage);
  });

  it('should reject non-admin users', async () => {
    mockInteraction.member.permissions = new PermissionsBitField([]);
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await acceptTermsButton.execute(botInteraction);

    expect(serverService.acceptTerms).not.toHaveBeenCalled();
    expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
      '❌ Only administrators can accept terms for this server.'
    );
  });

  it('should have correct handler properties', () => {
    expect(acceptTermsButton.name).toBe('acceptTerms');
    expect(acceptTermsButton.params).toEqual({});
  });
});
