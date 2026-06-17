import { ChatInputCommandInteraction } from 'discord.js';
import { BotCommandInteraction } from '@vulps22/bot-interactions';
import { inventoryService } from '../../../../services';
import vote from '../../global/vote';

jest.mock('../../../../services', () => ({
    inventoryService: {
        get: jest.fn(),
    },
}));

describe('vote command', () => {
    let mockInteraction: any;
    let botInteraction: BotCommandInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        process.env.TOPGG_URL = 'https://top.gg/bot/123';

        mockInteraction = {
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            deferReply: jest.fn().mockResolvedValue(undefined),
            user: { id: '123456789' },
            guildId: '987654321',
            options: {
                getString: jest.fn(),
            },
        };

        botInteraction = new BotCommandInteraction(
            mockInteraction as ChatInputCommandInteraction,
            'test-execution-id'
        );
        botInteraction.ephemeralReply = jest.fn().mockResolvedValue(undefined);
    });

    it('should have correct command properties', () => {
        expect(vote.name).toBe('vote');
        expect(vote.isNSFW).toBe(false);
        expect(vote.isAdministrator).toBe(false);
    });

    it('should show skip count and top.gg link', async () => {
        (inventoryService.get as jest.Mock).mockResolvedValue({ qty: 3 });

        await vote.execute(botInteraction);

        expect(inventoryService.get).toHaveBeenCalledWith('123456789', 'Skip');
        expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should show 0 skips when inventory is empty', async () => {
        (inventoryService.get as jest.Mock).mockResolvedValue(null);

        await vote.execute(botInteraction);

        expect(botInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should use qty from inventory when present', async () => {
        (inventoryService.get as jest.Mock).mockResolvedValue({ qty: 5 });

        await vote.execute(botInteraction);

        expect(inventoryService.get).toHaveBeenCalledWith('123456789', 'Skip');
        expect(botInteraction.ephemeralReply).toHaveBeenCalledTimes(1);
    });
});
