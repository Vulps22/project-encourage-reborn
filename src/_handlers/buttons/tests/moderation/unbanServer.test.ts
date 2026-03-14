import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '../../../../structures';
import unbanServerButton from '../../moderation/unbanServer';
import { serverService } from '../../../../services';
import { ServerProfileBuilder } from '../../../../builders/ServerProfileBuilder';
import { Logger } from '../../../../utils';

jest.mock('../../../../services');
jest.mock('../../../../builders/ServerProfileBuilder');
jest.mock('../../../../utils/Logger');

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
        (Logger.updateServerLog as jest.Mock).mockResolvedValue(undefined);
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
        expect(Logger.updateServerLog).toHaveBeenCalledWith(mockProfile);
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
        expect(Logger.updateServerLog).not.toHaveBeenCalled();
    });
});
