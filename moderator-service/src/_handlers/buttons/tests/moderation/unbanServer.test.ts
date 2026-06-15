import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import unbanServerButton from '../../moderation/unbanServer';
import { serverService } from '../../../../services';
import { ServerProfileBuilder } from '../../../../bot/builders/ServerProfileBuilder';
import { ModerationLogger } from '../../../../bot/utils/ModerationLogger';

jest.mock('../../../../services');
jest.mock('../../../../bot/builders/ServerProfileBuilder');
jest.mock('../../../../bot/utils/ModerationLogger', () => ({
    ModerationLogger: {
        updateServerLog: jest.fn(),
    }
}));

describe('unbanServerButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_unbanServer_id:123456789',
            deferred: false,
            replied: false,
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        (serverService.updateServerSettings as jest.Mock).mockResolvedValue(undefined);
        (ModerationLogger.updateServerLog as jest.Mock).mockResolvedValue(undefined);
    });

    it('should have correct name and params', () => {
        expect(unbanServerButton.name).toBe('unbanServer');
        expect(unbanServerButton.params).toEqual({ id: 'id' });
    });

    it('should unban server, update log, and refresh view', async () => {
        const mockProfile = { id: '123456789', name: 'Test Server', isBanned: false };
        (ServerProfileBuilder.prototype.getServerProfile as jest.Mock).mockResolvedValue(mockProfile);

        await unbanServerButton.execute(botInteraction);

        expect(serverService.updateServerSettings).toHaveBeenCalledWith('123456789', {
            is_banned: false,
            ban_reason: null
        });
        expect(ServerProfileBuilder.prototype.getServerProfile).toHaveBeenCalledWith('123456789');
        expect(ModerationLogger.updateServerLog).toHaveBeenCalledWith(mockProfile);
    });

    it('should handle missing server ID', async () => {
        mockInteraction.customId = 'moderation_unbanServer';
        botInteraction = new BotButtonInteraction(mockInteraction as ButtonInteraction, 'exec-123');

        await expect(unbanServerButton.execute(botInteraction)).rejects.toThrow(
            'Invalid server ID when using Button: moderation_unbanServer'
        );
        expect(serverService.updateServerSettings).not.toHaveBeenCalled();
    });

    it('should handle server not found after unban', async () => {
        (ServerProfileBuilder.prototype.getServerProfile as jest.Mock).mockResolvedValue(null);

        await unbanServerButton.execute(botInteraction);

        expect(serverService.updateServerSettings).toHaveBeenCalled();
        expect(ModerationLogger.updateServerLog).not.toHaveBeenCalled();
    });
});
