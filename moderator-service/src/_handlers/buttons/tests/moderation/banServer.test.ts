import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import banServerButton from '../../moderation/banServer';
import { moderationService } from '../../../../services';
import { ServerProfileBuilder } from '../../../../bot/builders/ServerProfileBuilder';
import { serverView } from '../../../../views';
import { TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../../../services');
jest.mock('../../../../bot/builders/ServerProfileBuilder');
jest.mock('../../../../views');

describe('banServerButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_banServer_id:987654321098765432',
            deferred: false,
            replied: false,
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            message: {
                awaitMessageComponent: jest.fn().mockResolvedValue({}),
                edit: jest.fn().mockResolvedValue(undefined)
            }
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );
    });

    it('should have correct name and params', () => {
        expect(banServerButton.name).toBe('banServer');
        expect(banServerButton.params).toEqual({ id: 'id' });
    });

    it('should show ban reasons dropdown and update component message in place', async () => {
        const mockProfile = {
            id: '987654321098765432',
            name: 'Test Server',
            is_banned: false,
            can_create: true
        };

        const mockReasons = [
            { label: 'Hate Speech', value: '3' },
            { label: 'Spam', value: '1' }
        ];

        (ServerProfileBuilder.prototype.getServerProfile as jest.Mock).mockResolvedValue(mockProfile);
        (moderationService.getBanReasons as jest.Mock).mockReturnValue(mockReasons);
        (serverView as jest.Mock).mockResolvedValue({ components: [] });

        await banServerButton.execute(botInteraction);

        expect(ServerProfileBuilder.prototype.getServerProfile).toHaveBeenCalledWith('987654321098765432');
        expect(moderationService.getBanReasons).toHaveBeenCalledWith(TargetType.Server);
        expect(serverView).toHaveBeenCalledWith(mockProfile, mockReasons);
        expect(mockInteraction.update).toHaveBeenCalled();
    });

    it('should handle missing server ID', async () => {
        mockInteraction.customId = 'moderation_banServer';
        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        await expect(banServerButton.execute(botInteraction)).rejects.toThrow(
            'Invalid server ID when using Button: moderation_banServer'
        );
    });

    it('should handle server not found', async () => {
        (ServerProfileBuilder.prototype.getServerProfile as jest.Mock).mockResolvedValue(null);

        await banServerButton.execute(botInteraction);

        expect(ServerProfileBuilder.prototype.getServerProfile).toHaveBeenCalledWith('987654321098765432');
        expect(moderationService.getBanReasons).not.toHaveBeenCalled();
        expect(serverView).not.toHaveBeenCalled();
    });

    it('should revert to button view on 60s timeout', async () => {
        const mockProfile = { id: '987654321098765432', name: 'Test Server' };
        (ServerProfileBuilder.prototype.getServerProfile as jest.Mock).mockResolvedValue(mockProfile);
        (moderationService.getBanReasons as jest.Mock).mockReturnValue([]);
        (serverView as jest.Mock).mockResolvedValue({ components: [] });

        // Simulate timeout by rejecting awaitMessageComponent
        mockInteraction.message.awaitMessageComponent = jest.fn().mockRejectedValue(new Error('timeout'));

        await banServerButton.execute(botInteraction);

        // Allow microtasks to flush
        await new Promise(resolve => setImmediate(resolve));

        expect(serverView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.message.edit).toHaveBeenCalled();
    });
});
