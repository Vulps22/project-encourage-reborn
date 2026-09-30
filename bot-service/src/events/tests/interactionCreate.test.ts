import { MessageFlags } from 'discord.js';
import { Logger } from '@vulps22/logger';

jest.mock('@vulps22/logger', () => ({
  Logger: {
    logInteractionReceived: jest.fn(),
    error: jest.fn(),
    updateExecution: jest.fn(),
  },
}));

jest.mock('../../services', () => ({
  userTrackingService: {
    trackInteraction: jest.fn(),
  },
  serverService: {
    isServerBanned: jest.fn().mockResolvedValue(false),
    getServerSettings: jest.fn().mockResolvedValue(null),
  },
  userService: {
    isUserBanned: jest.fn().mockResolvedValue(false),
    getUser: jest.fn().mockResolvedValue(null),
  },
  moderationService: {
    getBanReasonLabel: jest.fn((_type: unknown, value: string) => value),
  },
}));

const mockCommandInteractionEventExecute = jest.fn();
const mockButtonInteractionEventExecute = jest.fn();

jest.mock('../interactionEvents/CommandInteractionEvent', () => ({
  CommandInteractionEvent: class {
    execute = mockCommandInteractionEventExecute;
  }
}));

jest.mock('../interactionEvents/ButtonInteractionEvent', () => ({
  ButtonInteractionEvent: class {
    execute = mockButtonInteractionEventExecute;
  }
}));

import interactionCreate from '../interactionCreate';

describe('interactionCreate event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Logger.logInteractionReceived as jest.Mock).mockResolvedValue('execution-id-123');
    const { serverService, userService, moderationService } = require('../../services');
    (serverService.isServerBanned as jest.Mock).mockResolvedValue(false);
    (serverService.getServerSettings as jest.Mock).mockResolvedValue(null);
    (userService.isUserBanned as jest.Mock).mockResolvedValue(false);
    (userService.getUser as jest.Mock).mockResolvedValue(null);
    (moderationService.getBanReasonLabel as jest.Mock).mockImplementation((_type: unknown, value: string) => value);
  });

  it('should call command handler for chat input commands', async () => {
    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isStringSelectMenu: jest.fn().mockReturnValue(false),
      isChannelSelectMenu: jest.fn().mockReturnValue(false),
      isRepliable: jest.fn().mockReturnValue(true),
      guildId: '987654321',
      user: { id: '111222333' },
      reply: jest.fn()
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockCommandInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, '');
  });

  it('should call button handler for button interactions', async () => {
    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(true),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isStringSelectMenu: jest.fn().mockReturnValue(false),
      isChannelSelectMenu: jest.fn().mockReturnValue(false),
      isModalSubmit: jest.fn().mockReturnValue(false),
      isRepliable: jest.fn().mockReturnValue(true),
      guildId: '987654321',
      user: { id: '111222333' },
      customId: 'moderation_approveQuestion_id:123',
      reply: jest.fn()
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockButtonInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, '');
  });

  it('should block interactions from banned servers', async () => {
    const { serverService } = require('../../services');
    (serverService.isServerBanned as jest.Mock).mockResolvedValue('Hate Speech');

    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isStringSelectMenu: jest.fn().mockReturnValue(false),
      isChannelSelectMenu: jest.fn().mockReturnValue(false),
      isRepliable: jest.fn().mockReturnValue(true),
      guildId: '987654321',
      user: { id: '111222333' },
      reply: jest.fn().mockResolvedValue(undefined)
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'This server is banned from using the bot. Reason: Hate Speech'
    });
    expect(mockCommandInteractionEventExecute).not.toHaveBeenCalled();
  });

  it('should block interactions from banned users', async () => {
    const { userService } = require('../../services');
    (userService.isUserBanned as jest.Mock).mockResolvedValue('Harassment');

    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isStringSelectMenu: jest.fn().mockReturnValue(false),
      isChannelSelectMenu: jest.fn().mockReturnValue(false),
      isRepliable: jest.fn().mockReturnValue(true),
      guildId: '987654321',
      user: { id: '111222333' },
      reply: jest.fn().mockResolvedValue(undefined)
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'You are banned from using this bot. Reason: Harassment',
      flags: MessageFlags.Ephemeral
    });
    expect(mockCommandInteractionEventExecute).not.toHaveBeenCalled();
  });

  it('should fetch the server and user records once and hand them to the ban checks', async () => {
    const { serverService, userService } = require('../../services');
    const serverRecord = { id: '987654321', is_banned: false };
    const userRecord = { id: '111222333', is_banned: false };
    (serverService.getServerSettings as jest.Mock).mockResolvedValue(serverRecord);
    (userService.getUser as jest.Mock).mockResolvedValue(userRecord);

    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isStringSelectMenu: jest.fn().mockReturnValue(false),
      isChannelSelectMenu: jest.fn().mockReturnValue(false),
      isRepliable: jest.fn().mockReturnValue(true),
      guildId: '987654321',
      user: { id: '111222333' },
      reply: jest.fn()
    } as any;

    await interactionCreate.execute(mockInteraction);

    // One fetch each — the ban checks must reuse these rather than refetching.
    expect(serverService.getServerSettings).toHaveBeenCalledTimes(1);
    expect(userService.getUser).toHaveBeenCalledTimes(1);
    expect(serverService.isServerBanned).toHaveBeenCalledWith('987654321', serverRecord);
    expect(userService.isUserBanned).toHaveBeenCalledWith('111222333', userRecord);
  });

  it('should dispatch without waiting on the interaction log webhook', async () => {
    // A log webhook that never resolves must not hold up the interaction — this is
    // what was eating Discord's 3s initial-response window.
    (Logger.logInteractionReceived as jest.Mock).mockReturnValue(new Promise(() => { }));

    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false),
      isAutocomplete: jest.fn().mockReturnValue(false),
      isStringSelectMenu: jest.fn().mockReturnValue(false),
      isChannelSelectMenu: jest.fn().mockReturnValue(false),
      isRepliable: jest.fn().mockReturnValue(true),
      guildId: '987654321',
      user: { id: '111222333' },
      reply: jest.fn()
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockCommandInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, '');
  });
});