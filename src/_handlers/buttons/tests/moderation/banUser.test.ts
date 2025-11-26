import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '../../../../structures';
import banUserButton from '../../moderation/banUser';
import { userService } from '../../../../services';
import { UserProfileBuilder } from '../../../../builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';

jest.mock('../../../../services');
jest.mock('../../../../builders/UserProfileBuilder');
jest.mock('../../../../views');

describe('banUserButton', () => {
    let mockInteraction: any;
    let botInteraction: BotButtonInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockInteraction = {
            customId: 'moderation_banUser_id:123456789',
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
        expect(banUserButton.name).toBe('banUser');
        expect(banUserButton.params).toEqual({ 'ID': 'id' });
    });

    it('should ban user and refresh profile view', async () => {
        const mockProfile = {
            id: '123456789',
            isBanned: true,
            banReason: 'Banned by moderator',
            joinedAt: new Date(),
            serversJoined: 5,
            serversBanned: 1,
            questionsSubmitted: 10,
            questionsApproved: 8,
            questionsBanned: 2
        };

        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });

        await banUserButton.execute(botInteraction);

        expect(userService.banUser).toHaveBeenCalledWith('123456789', 'Banned by moderator');
        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
        mockInteraction.customId = 'moderation_banUser';
        botInteraction = new BotButtonInteraction(
            mockInteraction as ButtonInteraction,
            'exec-123'
        );

        await expect(banUserButton.execute(botInteraction)).rejects.toThrow(
            'Invalid user ID when using Button: moderation_banUser'
        );
    });

    it('should handle user not found after ban', async () => {
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(null);

        await banUserButton.execute(botInteraction);

        expect(userService.banUser).toHaveBeenCalledWith('123456789', 'Banned by moderator');
        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(userProfileView).not.toHaveBeenCalled();
    });
});
