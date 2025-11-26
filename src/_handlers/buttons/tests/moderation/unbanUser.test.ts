import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '../../../../structures';
import unbanUserButton from '../../moderation/unbanUser';
import { userService } from '../../../../services';
import { UserProfileBuilder } from '../../../../builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';

jest.mock('../../../../services');
jest.mock('../../../../builders/UserProfileBuilder');
jest.mock('../../../../views');

describe('unbanUserButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_unbanUser_id:123456789',
            deferred: false,
            replied: false,
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
        };

        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );
    });

    it('should have correct name and params', () => {
        expect(unbanUserButton.name).toBe('unbanUser');
        expect(unbanUserButton.params).toEqual({ 'ID': 'id' });
    });

    it('should unban user and refresh profile view', async () => {
        const mockProfile = {
            id: '123456789',
            isBanned: false,
            banReason: null,
            joinedAt: new Date(),
            serversJoined: 5,
            serversBanned: 0,
            questionsSubmitted: 10,
            questionsApproved: 8,
            questionsBanned: 2
        };

        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });

        await unbanUserButton.execute(botInteraction);

        expect(userService.unbanUser).toHaveBeenCalledWith('123456789');
        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
        mockInteraction.customId = 'moderation_unbanUser';
        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        await expect(unbanUserButton.execute(botInteraction)).rejects.toThrow(
            'Invalid user ID when using Button: moderation_unbanUser'
        );
    });

    it('should handle user not found after unban', async () => {
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(null);

        await unbanUserButton.execute(botInteraction);

        expect(userService.unbanUser).toHaveBeenCalledWith('123456789');
        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(userProfileView).not.toHaveBeenCalled();
    });
});
