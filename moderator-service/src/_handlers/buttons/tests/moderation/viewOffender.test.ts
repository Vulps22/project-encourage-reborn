import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import viewOffenderButton from '../../moderation/viewOffender';
import { UserProfileBuilder } from '../../../../bot/builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';

jest.mock('../../../../bot/builders/UserProfileBuilder');
jest.mock('../../../../views');

describe('viewOffenderButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_viewOffender_id:123456789012345678',
            deferred: false,
            replied: false,
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined)
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );
    });

    it('should have correct name and params', () => {
        expect(viewOffenderButton.name).toBe('viewOffender');
        expect(viewOffenderButton.params).toEqual({ id: 'id' });
    });

    it('should fetch profile and reply ephemerally with user profile view', async () => {
        const mockProfile = { id: '123456789012345678', isBanned: false };
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });

        await viewOffenderButton.execute(botInteraction);

        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789012345678');
        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
        mockInteraction.customId = 'moderation_viewOffender';
        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        await expect(viewOffenderButton.execute(botInteraction)).rejects.toThrow(
            'Invalid user ID when using Button: moderation_viewOffender'
        );
    });

    it('should reply ephemerally with error when user not found', async () => {
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(null);

        await viewOffenderButton.execute(botInteraction);

        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789012345678');
        expect(userProfileView).not.toHaveBeenCalled();
    });
});
