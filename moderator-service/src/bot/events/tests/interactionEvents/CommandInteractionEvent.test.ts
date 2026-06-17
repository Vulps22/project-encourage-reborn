import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { BotCommandInteraction } from '@vulps22/bot-interactions';

// Mock Logger before importing the event
jest.mock('../../../utils', () => ({
    Logger: {
        error: jest.fn(),
        updateExecution: jest.fn(),
    },
}));

const { CommandInteractionEvent } = require('../../interactionEvents/CommandInteractionEvent');
const { Logger } = require('../../../utils');

describe('CommandInteractionEvent (moderator-service)', () => {
    let event: InstanceType<typeof CommandInteractionEvent>;
    let mockDiscordInteraction: any;
    let mockCommand: any;
    let originalCommands: any;

    beforeAll(() => {
        originalCommands = (global as any).commands;
    });

    afterAll(() => {
        (global as any).commands = originalCommands;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        event = new CommandInteractionEvent();

        mockDiscordInteraction = {
            commandName: 'ban',
            user: { id: '123456789' },
            guildId: '987654321',
            replied: false,
            deferred: false,
            reply: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockResolvedValue(undefined),
            member: {
                permissions: new PermissionsBitField(['Administrator']),
            },
            options: {
                getString: jest.fn(),
            },
        };

        mockCommand = {
            name: 'ban',
            isAdministrator: false,
            execute: jest.fn().mockResolvedValue(undefined),
            autoComplete: jest.fn().mockResolvedValue(undefined),
        };

        (global as any).commands = new Map();
        (global as any).commands.set('ban', mockCommand);
    });

    describe('execute', () => {
        it('should return early when command not found', async () => {
            mockDiscordInteraction.commandName = 'unknown';

            await event.execute(mockDiscordInteraction, 'exec-1');

            expect(Logger.error).toHaveBeenCalledWith('No command found for name: unknown');
            expect(mockCommand.execute).not.toHaveBeenCalled();
        });

        it('should send error view when user lacks administrator permission', async () => {
            mockCommand.isAdministrator = true;
            mockDiscordInteraction.member.permissions = new PermissionsBitField([]);

            await event.execute(mockDiscordInteraction, 'exec-1');

            expect(mockDiscordInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
            expect(mockCommand.execute).not.toHaveBeenCalled();
        });

        it('should execute command for valid interaction', async () => {
            await event.execute(mockDiscordInteraction, 'exec-1');

            expect(mockCommand.execute).toHaveBeenCalledWith(expect.any(BotCommandInteraction));
            expect(Logger.updateExecution).toHaveBeenCalledWith('exec-1', 'Success');
        });

        it('should send error view when command throws and interaction is not replied', async () => {
            mockCommand.execute.mockRejectedValue(new Error('Something broke'));

            await event.execute(mockDiscordInteraction, 'exec-1');

            expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Something broke'));
            expect(mockDiscordInteraction.reply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });

        it('should not reply on error when interaction already replied', async () => {
            mockDiscordInteraction.replied = true;
            mockCommand.execute.mockRejectedValue(new Error('Something broke'));

            await event.execute(mockDiscordInteraction, 'exec-1');

            expect(mockDiscordInteraction.reply).not.toHaveBeenCalled();
        });

        it('should not reply on error when interaction already deferred', async () => {
            mockDiscordInteraction.deferred = true;
            mockCommand.execute.mockRejectedValue(new Error('Something broke'));

            await event.execute(mockDiscordInteraction, 'exec-1');

            expect(mockDiscordInteraction.reply).not.toHaveBeenCalled();
        });
    });

    describe('autocomplete', () => {
        let mockAutocompleteInteraction: any;

        beforeEach(() => {
            mockAutocompleteInteraction = {
                commandName: 'ban',
                respond: jest.fn().mockResolvedValue(undefined),
            };
        });

        it('should return early when command not found', async () => {
            mockAutocompleteInteraction.commandName = 'unknown';

            await event.autocomplete(mockAutocompleteInteraction);

            expect(Logger.error).toHaveBeenCalledWith(
                expect.stringContaining('No command found')
            );
        });

        it('should call command autoComplete handler', async () => {
            await event.autocomplete(mockAutocompleteInteraction);

            expect(mockCommand.autoComplete).toHaveBeenCalledWith(mockAutocompleteInteraction);
        });

        it('should handle autoComplete errors gracefully', async () => {
            mockCommand.autoComplete.mockRejectedValue(new Error('Autocomplete failed'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await expect(event.autocomplete(mockAutocompleteInteraction)).resolves.not.toThrow();

            consoleSpy.mockRestore();
        });
    });
});
