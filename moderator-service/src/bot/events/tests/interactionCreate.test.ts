// import { MessageFlags } from 'discord.js';
// import { Logger } from '../../utils';

// jest.mock('../../utils', () => ({
//   Logger: {
//     logInteractionReceived: jest.fn(),
//     error: jest.fn(),
//     updateExecution: jest.fn(),
//   },
// }));

// jest.mock('../../services', () => ({
//   userTrackingService: {
//     trackInteraction: jest.fn(),
//   },
//   serverService: {
//     isServerBanned: jest.fn().mockResolvedValue(false),
//   },
//   userService: {
//     isUserBanned: jest.fn().mockResolvedValue(false),
//   },
//   moderationService: {
//     getBanReasonLabel: jest.fn((_type: unknown, value: string) => value),
//   },
// }));

// const mockCommandInteractionEventExecute = jest.fn();
// const mockButtonInteractionEventExecute = jest.fn();

// jest.mock('../interactionEvents/CommandInteractionEvent', () => ({
//   CommandInteractionEvent: class {
//     execute = mockCommandInteractionEventExecute;
//   }
// }));

// jest.mock('../interactionEvents/ButtonInteractionEvent', () => ({
//   ButtonInteractionEvent: class {
//     execute = mockButtonInteractionEventExecute;
//   }
// }));

// import interactionCreate from '../interactionCreate';

// describe('interactionCreate event', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     (Logger.logInteractionReceived as jest.Mock).mockResolvedValue('execution-id-123');
//     const { serverService, userService, moderationService } = require('../../services');
//     (serverService.isServerBanned as jest.Mock).mockResolvedValue(false);
//     (userService.isUserBanned as jest.Mock).mockResolvedValue(false);
//     (moderationService.getBanReasonLabel as jest.Mock).mockImplementation((_type: unknown, value: string) => value);
//   });

//   it('should call command handler for chat input commands', async () => {
//     const mockInteraction = {
//       isChatInputCommand: jest.fn().mockReturnValue(true),
//       isButton: jest.fn().mockReturnValue(false),
//       isAutocomplete: jest.fn().mockReturnValue(false),
//       isStringSelectMenu: jest.fn().mockReturnValue(false),
//       isChannelSelectMenu: jest.fn().mockReturnValue(false),
//       isRepliable: jest.fn().mockReturnValue(true),
//       guildId: '987654321',
//       user: { id: '111222333' },
//       reply: jest.fn()
//     } as any;

//     await interactionCreate.execute(mockInteraction);

//     expect(mockCommandInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
//   });

//   it('should call button handler for button interactions', async () => {
//     const mockInteraction = {
//       isChatInputCommand: jest.fn().mockReturnValue(false),
//       isButton: jest.fn().mockReturnValue(true),
//       isAutocomplete: jest.fn().mockReturnValue(false),
//       isStringSelectMenu: jest.fn().mockReturnValue(false),
//       isChannelSelectMenu: jest.fn().mockReturnValue(false),
//       isModalSubmit: jest.fn().mockReturnValue(false),
//       isRepliable: jest.fn().mockReturnValue(true),
//       guildId: '987654321',
//       user: { id: '111222333' },
//       customId: 'moderation_approveQuestion_id:123',
//       reply: jest.fn()
//     } as any;

//     await interactionCreate.execute(mockInteraction);

//     expect(mockButtonInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
//   });

//   it('should block interactions from banned servers', async () => {
//     const { serverService } = require('../../services');
//     (serverService.isServerBanned as jest.Mock).mockResolvedValue('Hate Speech');

//     const mockInteraction = {
//       isChatInputCommand: jest.fn().mockReturnValue(true),
//       isButton: jest.fn().mockReturnValue(false),
//       isAutocomplete: jest.fn().mockReturnValue(false),
//       isStringSelectMenu: jest.fn().mockReturnValue(false),
//       isChannelSelectMenu: jest.fn().mockReturnValue(false),
//       isRepliable: jest.fn().mockReturnValue(true),
//       guildId: '987654321',
//       user: { id: '111222333' },
//       reply: jest.fn().mockResolvedValue(undefined)
//     } as any;

//     await interactionCreate.execute(mockInteraction);

//     expect(mockInteraction.reply).toHaveBeenCalledWith({
//       content: 'This server is banned from using the bot. Reason: Hate Speech'
//     });
//     expect(mockCommandInteractionEventExecute).not.toHaveBeenCalled();
//   });

//   it('should block interactions from banned users', async () => {
//     const { userService } = require('../../services');
//     (userService.isUserBanned as jest.Mock).mockResolvedValue('Harassment');

//     const mockInteraction = {
//       isChatInputCommand: jest.fn().mockReturnValue(true),
//       isButton: jest.fn().mockReturnValue(false),
//       isAutocomplete: jest.fn().mockReturnValue(false),
//       isStringSelectMenu: jest.fn().mockReturnValue(false),
//       isChannelSelectMenu: jest.fn().mockReturnValue(false),
//       isRepliable: jest.fn().mockReturnValue(true),
//       guildId: '987654321',
//       user: { id: '111222333' },
//       reply: jest.fn().mockResolvedValue(undefined)
//     } as any;

//     await interactionCreate.execute(mockInteraction);

//     expect(mockInteraction.reply).toHaveBeenCalledWith({
//       content: 'You are banned from using this bot. Reason: Harassment',
//       flags: MessageFlags.Ephemeral
//     });
//     expect(mockCommandInteractionEventExecute).not.toHaveBeenCalled();
//   });
// });