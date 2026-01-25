import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { serverService } from '../../../../services';
import { BotCommandInteraction } from '../../../../structures';
import { termsView } from '../../../../views';
import setup from '../../global/setup';

// Mock services and views
jest.mock('../../../../services', () => ({
  serverService: {
    getOrCreateServer: jest.fn(),
  },
}));

jest.mock('../../../../views', () => ({
  termsView: jest.fn(),
}));

describe('setup command', () => {
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
      guild: {
        id: '987654321',
        name: 'Test Server',
        ownerId: '111222333',
      },
      channelId: '444555666',
      member: {
        permissions: new PermissionsBitField(['Administrator']),
      },
      options: {
        getString: jest.fn(),
      },
    };

    botInteraction = new BotCommandInteraction(
      mockInteraction as ChatInputCommandInteraction,
      'test-execution-id'
    );
  });

  it('should show terms view to admin users', async () => {
    const mockTermsMessage = {
      components: [],
      flags: 4096,
    };

    (serverService.getOrCreateServer as jest.Mock).mockResolvedValue({
      id: '987654321',
      name: 'Test Server',
      owner: '111222333',
      has_accepted: false,
      can_create: false,
    });

    (termsView as jest.Mock).mockReturnValue(mockTermsMessage);

    // Mock sendReply method
    botInteraction.sendReply = jest.fn().mockResolvedValue(undefined);

    await setup.execute(botInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(serverService.getOrCreateServer).toHaveBeenCalledWith(
      '987654321',
      'Test Server',
      '111222333'
    );
    expect(termsView).toHaveBeenCalled();
    expect(botInteraction.sendReply).toHaveBeenCalledWith(null, mockTermsMessage);
  });

  it('should reject non-admin users', async () => {
    mockInteraction.member.permissions = new PermissionsBitField([]);

    await setup.execute(botInteraction);

    expect(mockInteraction.deferReply).not.toHaveBeenCalled();
    expect(serverService.getOrCreateServer).not.toHaveBeenCalled();
  });

  it('should reject DM usage', async () => {
    mockInteraction.guildId = null;
    mockInteraction.guild = null;

    await setup.execute(botInteraction);

    expect(serverService.getOrCreateServer).not.toHaveBeenCalled();
  });

  it('should have correct command properties', () => {
    expect(setup.name).toBe('setup');
    expect(setup.isNSFW).toBe(false);
    expect(setup.isAdministrator).toBe(false); // We check manually
  });
});
