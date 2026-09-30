import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';

// Mock the Logger before importing ButtonInteractionEvent
jest.mock('../../../utils', () => ({
    Logger: {
        debug: jest.fn(),
        error: jest.fn(),
        updateExecution: jest.fn()
    }
}));

jest.mock('../../../../services', () => ({
    analyticsService: { logEvent: jest.fn() },
}));

const { ButtonInteractionEvent } = require('../../interactionEvents/ButtonInteractionEvent')
const { Logger } = require('../../../utils');
const { analyticsService } = require('../../../../services');

describe('ButtonInteractionEvent', () => {
    let buttonInteractionEvent: InstanceType<typeof ButtonInteractionEvent>;
    let mockButtonInteraction: jest.Mocked<ButtonInteraction>;
    let mockHandler: any;
    let originalGlobal: any;
    let originalConsoleLog: any;

    beforeAll(() => {
        // Save original global state
        originalGlobal = {
            buttons: (global as any).buttons
        };
        // Mock console.log to avoid test output pollution
        originalConsoleLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        // Restore original global state
        (global as any).buttons = originalGlobal.buttons;
        console.log = originalConsoleLog;
    });

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create instance
        buttonInteractionEvent = new ButtonInteractionEvent();

        // Create mock button interaction
        mockButtonInteraction = {
            customId: 'moderation_approveQuestion_id:123',
            user: {
                id: '987654321',
                username: 'testuser'
            },
            guildId: '111111111',
            guild: {
                id: '111111111',
                name: 'Test Guild'
            },
            replied: false,
            deferred: false,
            reply: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined)
        } as any;

        // Create mock handler
        mockHandler = {
            name: 'approveQuestion',
            interactionInitiator: true,
            execute: jest.fn().mockResolvedValue(undefined)
        };

        // Set up global buttons collection
        (global as any).buttons = new Map();
        (global as any).buttons.set('moderation_approveQuestion', mockHandler);
    });

    describe('execute', () => {
        it('should execute handler for valid button interaction', async () => {
            const executionId = 'test-execution-id';

            await buttonInteractionEvent.execute(mockButtonInteraction, executionId);

            expect(mockHandler.execute).toHaveBeenCalledWith(expect.any(BotButtonInteraction));

            // Verify the BotButtonInteraction was created correctly
            const botInteractionArg = mockHandler.execute.mock.calls[0][0];
            expect(botInteractionArg.baseId).toBe('moderation_approveQuestion');
            expect(botInteractionArg.action).toBe('approveQuestion');
            expect(botInteractionArg.params.get('id')).toBe('123');
        });

        describe('analytics logging', () => {
            it('should log an analytics event when the button is an initiator', async () => {
                await buttonInteractionEvent.execute(mockButtonInteraction, 'test-execution-id');

                expect(analyticsService.logEvent).toHaveBeenCalledWith('button', 'moderation_approveQuestion', true, '987654321', '111111111');
            });

            it('should pass interactionInitiator through as false when the button is not an initiator', async () => {
                mockHandler.interactionInitiator = false;

                await buttonInteractionEvent.execute(mockButtonInteraction, 'test-execution-id');

                expect(analyticsService.logEvent).toHaveBeenCalledWith('button', 'moderation_approveQuestion', false, '987654321', '111111111');
            });
        });

        it('should handle missing handler gracefully', async () => {
            mockButtonInteraction.customId = 'unknown_handler_id:123';
            const executionId = 'test-execution-id';

            await buttonInteractionEvent.execute(mockButtonInteraction, executionId);

            expect(Logger.error).toHaveBeenCalledWith('Button not found for Custom ID: unknown_handler');
            expect(mockHandler.execute).not.toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();
        });

        it('should handle handler execution errors gracefully', async () => {
            const testError = new Error('Handler execution failed');
            mockHandler.execute.mockRejectedValue(testError);
            const executionId = 'test-execution-id';

            await expect(buttonInteractionEvent.execute(mockButtonInteraction, executionId))
                .resolves.not.toThrow();

            expect(mockHandler.execute).toHaveBeenCalledWith(expect.any(BotButtonInteraction));
            expect(mockButtonInteraction.reply).toHaveBeenCalledWith({
                content: '❌ An error occurred while processing this action.',
                flags: 64
            });
        });

        it('should not reply on error if interaction already replied', async () => {
            mockButtonInteraction.replied = true;
            const testError = new Error('Handler execution failed');
            mockHandler.execute.mockRejectedValue(testError);
            const executionId = 'test-execution-id';

            await expect(buttonInteractionEvent.execute(mockButtonInteraction, executionId))
                .resolves.not.toThrow();

            expect(mockButtonInteraction.reply).not.toHaveBeenCalled();
        });

        it('should not reply on error if interaction already deferred', async () => {
            mockButtonInteraction.deferred = true;
            const testError = new Error('Handler execution failed');
            mockHandler.execute.mockRejectedValue(testError);
            const executionId = 'test-execution-id';

            await expect(buttonInteractionEvent.execute(mockButtonInteraction, executionId))
                .resolves.not.toThrow();

            expect(mockButtonInteraction.reply).not.toHaveBeenCalled();
        });

        it('should parse complex custom IDs correctly', async () => {
            mockButtonInteraction.customId = 'moderation_banQuestion_id:456_reason:spam_modId:789';
            const banHandler = {
                name: 'banQuestion',
                execute: jest.fn().mockResolvedValue(undefined)
            };
            (global as any).buttons.set('moderation_banQuestion', banHandler);
            const executionId = 'test-execution-id';

            await buttonInteractionEvent.execute(mockButtonInteraction, executionId);

            const botInteractionArg = banHandler.execute.mock.calls[0][0];
            expect(botInteractionArg.baseId).toBe('moderation_banQuestion');
            expect(botInteractionArg.action).toBe('banQuestion');
            expect(botInteractionArg.params.get('id')).toBe('456');
            expect(botInteractionArg.params.get('reason')).toBe('spam');
            expect(botInteractionArg.params.get('modId')).toBe('789');
        });

        it('should handle simple custom IDs without parameters', async () => {
            mockButtonInteraction.customId = 'simple_action';
            const simpleHandler = {
                name: 'simple',
                execute: jest.fn().mockResolvedValue(undefined)
            };
            (global as any).buttons.set('simple_action', simpleHandler);
            const executionId = 'test-execution-id';

            await buttonInteractionEvent.execute(mockButtonInteraction, executionId);

            const botInteractionArg = simpleHandler.execute.mock.calls[0][0];
            expect(botInteractionArg.baseId).toBe('simple_action');
            expect(botInteractionArg.action).toBe('action');
            expect(botInteractionArg.params.size).toBe(0);
        });
    });
});
