import { GuildNSFWLevel } from 'discord.js';

jest.mock('@vulps22/logger', () => ({
    Logger: {
        debug: jest.fn(),
        error: jest.fn(),
        updateExecution: jest.fn()
    }
}));

const { CommandInteractionEvent } = require('../../interactionEvents/CommandInteractionEvent');
const { BotCommandInteraction } = require('@vulps22/bot-interactions');
const { Logger } = require('@vulps22/logger');

describe('CommandInteractionEvent', () => {
    let commandInteractionEvent: InstanceType<typeof CommandInteractionEvent>;
    let mockInteraction: any;
    let mockCommand: any;
    let originalGlobal: any;

    beforeAll(() => {
        originalGlobal = { commands: (global as any).commands };
    });

    afterAll(() => {
        (global as any).commands = originalGlobal.commands;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        commandInteractionEvent = new CommandInteractionEvent();

        mockInteraction = {
            commandName: 'truth',
            replied: false,
            deferred: false,
            guild: { id: '111', nsfwLevel: GuildNSFWLevel.Default },
            channel: { nsfw: false },
            user: { id: 'user-1', username: 'tester' },
            member: { permissions: { has: jest.fn().mockReturnValue(false) } },
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            followUp: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockResolvedValue(undefined),
        };

        mockCommand = {
            name: 'truth',
            isNSFW: false,
            isAdministrator: false,
            execute: jest.fn().mockResolvedValue(undefined),
            autoComplete: jest.fn().mockResolvedValue(undefined),
        };

        (global as any).commands = new Map();
        (global as any).commands.set('truth', mockCommand);
    });

    describe('execute', () => {
        it('should execute the command for a valid interaction', async () => {
            await commandInteractionEvent.execute(mockInteraction, 'exec-1');

            expect(mockCommand.execute).toHaveBeenCalledWith(expect.any(BotCommandInteraction));
        });

        it('should log an error and return when command is not found', async () => {
            mockInteraction.commandName = 'unknown';

            await commandInteractionEvent.execute(mockInteraction, 'exec-1');

            expect(Logger.error).toHaveBeenCalledWith('No command found for name: unknown');
            expect(mockCommand.execute).not.toHaveBeenCalled();
        });

        describe('NSFW enforcement', () => {
            beforeEach(() => {
                mockCommand.isNSFW = true;
            });

            it('should block NSFW command in SFW channel on Safe guild', async () => {
                mockInteraction.channel.nsfw = false;
                mockInteraction.guild.nsfwLevel = GuildNSFWLevel.Safe;

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).toHaveBeenCalledWith('❌ This command can only be used in NSFW channels or servers.');
                expect(mockCommand.execute).not.toHaveBeenCalled();
            });

            it('should block NSFW command in SFW channel on Default guild', async () => {
                mockInteraction.channel.nsfw = false;
                mockInteraction.guild.nsfwLevel = GuildNSFWLevel.Default;

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).toHaveBeenCalledWith('❌ This command can only be used in NSFW channels or servers.');
                expect(mockCommand.execute).not.toHaveBeenCalled();
            });

            it('should allow NSFW command in an NSFW channel regardless of guild level', async () => {
                mockInteraction.channel.nsfw = true;
                mockInteraction.guild.nsfwLevel = GuildNSFWLevel.Default;

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).not.toHaveBeenCalled();
                expect(mockCommand.execute).toHaveBeenCalled();
            });

            it('should allow NSFW command on an age-restricted guild with SFW channel', async () => {
                mockInteraction.channel.nsfw = false;
                mockInteraction.guild.nsfwLevel = GuildNSFWLevel.AgeRestricted;

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).not.toHaveBeenCalled();
                expect(mockCommand.execute).toHaveBeenCalled();
            });

            it('should allow NSFW command on an Explicit guild with SFW channel', async () => {
                mockInteraction.channel.nsfw = false;
                mockInteraction.guild.nsfwLevel = GuildNSFWLevel.Explicit;

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).not.toHaveBeenCalled();
                expect(mockCommand.execute).toHaveBeenCalled();
            });

            it('should not apply NSFW check for non-NSFW commands', async () => {
                mockCommand.isNSFW = false;
                mockInteraction.channel.nsfw = false;
                mockInteraction.guild.nsfwLevel = GuildNSFWLevel.Safe;

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).not.toHaveBeenCalled();
                expect(mockCommand.execute).toHaveBeenCalled();
            });
        });

        describe('administrator enforcement', () => {
            beforeEach(() => {
                mockCommand.isAdministrator = true;
            });

            it('should block non-administrator from admin command', async () => {
                mockInteraction.member.permissions.has.mockReturnValue(false);

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockCommand.execute).not.toHaveBeenCalled();
            });
        });

        describe('error handling', () => {
            it('should handle command execution errors gracefully', async () => {
                mockCommand.execute.mockRejectedValue(new Error('boom'));

                await expect(commandInteractionEvent.execute(mockInteraction, 'exec-1'))
                    .resolves.not.toThrow();

                expect(Logger.error).toHaveBeenCalled();
            });

            it('should not reply on error if already replied', async () => {
                mockInteraction.replied = true;
                mockCommand.execute.mockRejectedValue(new Error('boom'));

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).not.toHaveBeenCalled();
            });

            it('should not reply on error if already deferred', async () => {
                mockInteraction.deferred = true;
                mockCommand.execute.mockRejectedValue(new Error('boom'));

                await commandInteractionEvent.execute(mockInteraction, 'exec-1');

                expect(mockInteraction.reply).not.toHaveBeenCalled();
            });
        });
    });
});
