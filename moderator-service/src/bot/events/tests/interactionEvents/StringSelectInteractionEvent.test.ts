// import { StringSelectMenuInteraction } from 'discord.js';

// jest.mock('../../../utils/Logger', () => ({
//     Logger: {
//         debug: jest.fn(),
//         error: jest.fn(),
//         updateExecution: jest.fn()
//     }
// }));

// const { StringSelectInteractionEvent } = require('../../interactionEvents/StringSelectInteractionEvent');
// const { BotSelectMenuInteraction } = require('../../../structures');
// const { Logger } = require('../../../utils');

// describe('StringSelectInteractionEvent', () => {
//     let stringSelectInteractionEvent: InstanceType<typeof StringSelectInteractionEvent>;
//     let mockSelectInteraction: jest.Mocked<StringSelectMenuInteraction>;
//     let mockHandler: any;
//     let originalGlobal: any;
//     let originalConsoleLog: any;

//     beforeAll(() => {
//         originalGlobal = { selects: (global as any).selects };
//         originalConsoleLog = console.log;
//         console.log = jest.fn();
//     });

//     afterAll(() => {
//         (global as any).selects = originalGlobal.selects;
//         console.log = originalConsoleLog;
//     });

//     beforeEach(() => {
//         jest.clearAllMocks();

//         stringSelectInteractionEvent = new StringSelectInteractionEvent();

//         mockSelectInteraction = {
//             customId: 'moderation_userBanReasonSelected_id:123',
//             values: ['reason_harassment'],
//             user: {
//                 id: '987654321',
//                 username: 'testuser'
//             },
//             guild: {
//                 id: '111111111',
//                 name: 'Test Guild'
//             },
//             replied: false,
//             deferred: false,
//             reply: jest.fn().mockResolvedValue(undefined),
//             deferReply: jest.fn().mockResolvedValue(undefined),
//             followUp: jest.fn().mockResolvedValue(undefined)
//         } as any;

//         mockHandler = {
//             name: 'userBanReasonSelected',
//             execute: jest.fn().mockResolvedValue(undefined)
//         };

//         (global as any).selects = new Map();
//         (global as any).selects.set('moderation_userBanReasonSelected', mockHandler);
//     });

//     describe('execute', () => {
//         it('should execute handler for valid select menu interaction', async () => {
//             const executionId = 'test-execution-id';

//             await stringSelectInteractionEvent.execute(mockSelectInteraction, executionId);

//             expect(mockHandler.execute).toHaveBeenCalledWith(expect.any(BotSelectMenuInteraction));

//             const botInteractionArg = mockHandler.execute.mock.calls[0][0];
//             expect(botInteractionArg.baseId).toBe('moderation_userBanReasonSelected');
//             expect(botInteractionArg.action).toBe('userBanReasonSelected');
//             expect(botInteractionArg.params.get('id')).toBe('123');
//         });

//         it('should handle missing handler gracefully', async () => {
//             mockSelectInteraction.customId = 'unknown_handler_id:123';
//             const executionId = 'test-execution-id';

//             await stringSelectInteractionEvent.execute(mockSelectInteraction, executionId);

//             expect(Logger.error).toHaveBeenCalledWith('SelectMenu not found for Custom ID: unknown_handler');
//             expect(mockHandler.execute).not.toHaveBeenCalled();
//         });

//         it('should handle handler execution errors gracefully', async () => {
//             const testError = new Error('Handler execution failed');
//             mockHandler.execute.mockRejectedValue(testError);
//             const executionId = 'test-execution-id';

//             await expect(stringSelectInteractionEvent.execute(mockSelectInteraction, executionId))
//                 .resolves.not.toThrow();

//             expect(mockHandler.execute).toHaveBeenCalledWith(expect.any(BotSelectMenuInteraction));
//             expect(mockSelectInteraction.reply).toHaveBeenCalledWith({
//                 content: '❌ An error occurred while processing this action.',
//                 flags: 64
//             });
//         });

//         it('should not reply on error if interaction already replied', async () => {
//             mockSelectInteraction.replied = true;
//             const testError = new Error('Handler execution failed');
//             mockHandler.execute.mockRejectedValue(testError);
//             const executionId = 'test-execution-id';

//             await expect(stringSelectInteractionEvent.execute(mockSelectInteraction, executionId))
//                 .resolves.not.toThrow();

//             expect(mockSelectInteraction.reply).not.toHaveBeenCalled();
//         });

//         it('should not reply on error if interaction already deferred', async () => {
//             mockSelectInteraction.deferred = true;
//             const testError = new Error('Handler execution failed');
//             mockHandler.execute.mockRejectedValue(testError);
//             const executionId = 'test-execution-id';

//             await expect(stringSelectInteractionEvent.execute(mockSelectInteraction, executionId))
//                 .resolves.not.toThrow();

//             expect(mockSelectInteraction.reply).not.toHaveBeenCalled();
//         });
//     });
// });
