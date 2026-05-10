import { ChannelSelectMenuInteraction, PermissionsBitField } from 'discord.js';
import { serverService } from '../../../../services';
import { BotSelectMenuInteraction } from '@vulps22/bot-interactions';
import { setupCompleteView } from '../../../../views';
import announcementChannelSelected from '../../setup/announcementChannelSelected';

jest.mock('../../../../services', () => ({
  serverService: {
    setAnnouncementChannel: jest.fn(),
  },
}));

jest.mock('../../../../views', () => ({
  setupCompleteView: jest.fn(),
  setupFailedView: jest.fn(),
}));

jest.mock('../../../../config', () => ({
  Config: {
    ANNOUNCEMENT_CHANNEL_ID: '', // Empty means no IPC call
  },
}));

describe('announcementChannelSelected select menu', () => {
  let mockInteraction: any;
  let botInteraction: BotSelectMenuInteraction;

  beforeAll(() => {
    // Mock global.client with shard support
    global.client = {
      shard: null,
    } as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      customId: 'setup_announcementChannelSelected',
      values: ['123456789012345678'],
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

    botInteraction = new BotSelectMenuInteraction(
      mockInteraction as ChannelSelectMenuInteraction,
      'test-execution-id'
    );
  });

  it('should save announcement channel for admin users', async () => {
    const mockMessage = { components: [] };
    (setupCompleteView as jest.Mock).mockReturnValue(mockMessage);

    await announcementChannelSelected.execute(botInteraction);

    expect(mockInteraction.deferUpdate).toHaveBeenCalled();
    expect(serverService.setAnnouncementChannel).toHaveBeenCalledWith(
      '987654321',
      '123456789012345678'
    );
    expect(setupCompleteView).toHaveBeenCalledWith('123456789012345678');
    expect(mockInteraction.update).toHaveBeenCalledWith(mockMessage);
  });

  it('should reject non-admin users', async () => {
    mockInteraction.member.permissions = new PermissionsBitField([]);
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await announcementChannelSelected.execute(botInteraction);

    expect(serverService.setAnnouncementChannel).not.toHaveBeenCalled();
  });

  it('should reject if no guild', async () => {
    mockInteraction.guildId = null;
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await announcementChannelSelected.execute(botInteraction);

    expect(serverService.setAnnouncementChannel).not.toHaveBeenCalled();
  });

  it('should reject if no channel selected', async () => {
    mockInteraction.values = [];
    botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);

    await announcementChannelSelected.execute(botInteraction);

    expect(serverService.setAnnouncementChannel).not.toHaveBeenCalled();
  });

  it('should have correct handler properties', () => {
    expect(announcementChannelSelected.name).toBe('announcementChannelSelected');
    expect(announcementChannelSelected.params).toEqual({});
  });
});
