import { ChatInputCommandInteraction } from 'discord.js';
import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { dsClient, msClient } from '../../../../client';
import { TargetType } from '@vulps22/project-encourage-types';
import report from '../../global/report';

jest.mock('../../../../client', () => ({
    dsClient: {
        searchQuestions: jest.fn().mockResolvedValue([]),
        getQuestion: jest.fn(),
        getServer: jest.fn(),
    },
    msClient: {
        submitReport: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('report command', () => {
    let mockInteraction: any;
    let botInteraction: BotCommandInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockResolvedValue(undefined),
            user: { id: '111222333444555666' },
            guildId: '987654321098765432',
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn(),
            },
        };

        botInteraction = new BotCommandInteraction(
            mockInteraction as ChatInputCommandInteraction,
            'test-execution-id'
        );
        botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);
    });

    describe('command definition', () => {
        it('should have correct name', () => {
            expect(report.name).toBe('report');
        });

        it('should not be NSFW', () => {
            expect(report.isNSFW).toBe(false);
        });

        it('should not require administrator', () => {
            expect(report.isAdministrator).toBe(false);
        });

        it('should have question and server subcommands', () => {
            const json = report.toJSON();
            expect(json.options).toHaveLength(2);
            const names = json.options.map((o: any) => o.name);
            expect(names).toContain('question');
            expect(names).toContain('server');
        });
    });

    describe('question subcommand', () => {
        beforeEach(() => {
            mockInteraction.options.getSubcommand.mockReturnValue('question');
        });

        it('should defer reply with ephemeral flag', async () => {
            mockInteraction.options.getString.mockReturnValue('42');
            (dsClient.getQuestion as jest.Mock).mockResolvedValue({
                id: 42,
                question: 'What is your biggest secret?',
            });

            await report.execute(botInteraction);

            expect(mockInteraction.deferReply).toHaveBeenCalled();
        });

        it('should submit question report and reply with success', async () => {
            // getString('id') is called twice: once for getQuestion, once for offenderId
            mockInteraction.options.getString
                .mockReturnValueOnce('42')              // id (getQuestion)
                .mockReturnValueOnce('42')              // id (offenderId)
                .mockReturnValueOnce('Offensive content'); // reason

            (dsClient.getQuestion as jest.Mock).mockResolvedValue({
                id: 42,
                question: 'What is your biggest secret?',
            });

            await report.execute(botInteraction);

            expect(dsClient.getQuestion).toHaveBeenCalledWith(42);
            expect(msClient.submitReport).toHaveBeenCalledWith(
                '111222333444555666',
                '42',
                TargetType.Question,
                '987654321098765432',
                'What is your biggest secret?',
                'Offensive content'
            );
            expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });

        it('should send error view when question not found', async () => {
            mockInteraction.options.getString.mockReturnValue('99');
            (dsClient.getQuestion as jest.Mock).mockResolvedValue(null);

            await report.execute(botInteraction);

            expect(msClient.submitReport).not.toHaveBeenCalled();
            expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });

        it('should send error view when id is 0', async () => {
            mockInteraction.options.getString.mockReturnValue('0');

            await report.execute(botInteraction);

            expect(dsClient.getQuestion).not.toHaveBeenCalled();
            expect(msClient.submitReport).not.toHaveBeenCalled();
            expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });

        it('should use "No reason provided" as default reason', async () => {
            // getString('id') is called twice: once for getQuestion, once for offenderId
            mockInteraction.options.getString
                .mockReturnValueOnce('42')  // id (getQuestion)
                .mockReturnValueOnce('42')  // id (offenderId)
                .mockReturnValueOnce(null); // reason (not provided)

            (dsClient.getQuestion as jest.Mock).mockResolvedValue({
                id: 42,
                question: 'Test question?',
            });

            await report.execute(botInteraction);

            expect(msClient.submitReport).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.any(String),
                'No reason provided'
            );
        });
    });

    describe('server subcommand', () => {
        beforeEach(() => {
            mockInteraction.options.getSubcommand.mockReturnValue('server');
        });

        it('should submit server report and reply with success', async () => {
            mockInteraction.options.getString.mockReturnValue('Spam server');

            (dsClient.getServer as jest.Mock).mockResolvedValue({
                id: '987654321',
                name: 'Test Server',
            });

            await report.execute(botInteraction);

            expect(dsClient.getServer).toHaveBeenCalledWith('987654321098765432');
            expect(msClient.submitReport).toHaveBeenCalledWith(
                '111222333444555666',
                '987654321098765432',
                TargetType.Server,
                '987654321098765432',
                'Test Server',
                'Spam server'
            );
            expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });

        it('should send error view when server not found', async () => {
            mockInteraction.options.getString.mockReturnValue(null);
            (dsClient.getServer as jest.Mock).mockResolvedValue(null);

            await report.execute(botInteraction);

            expect(msClient.submitReport).not.toHaveBeenCalled();
            expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });
    });

    describe('invalid subcommand', () => {
        it('should send error view for unknown subcommand', async () => {
            mockInteraction.options.getSubcommand.mockReturnValue('unknown');

            await report.execute(botInteraction);

            expect(msClient.submitReport).not.toHaveBeenCalled();
            expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
                expect.objectContaining({ flags: expect.any(Number) })
            );
        });
    });
});
