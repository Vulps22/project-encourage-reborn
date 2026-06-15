import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import unbanUserButton from '../../moderation/unbanUser';
import { questionService, serverService, userService } from '../../../../services';
import { UserProfileBuilder } from '../../../../bot/builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';

jest.mock('../../../../services');
jest.mock('../../../../bot/builders/UserProfileBuilder');
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

    it('should unban user, questions, and servers then refresh profile', async () => {
        const mockProfile = {
            id: '123456789',
            isBanned: false,
            banReason: null,
            rulesAccepted: true,
            globalLevel: 1,
            globalXP: 100,
            totalQuestions: 10,
            approvedQuestions: 8,
            bannedQuestions: 0,
            totalServers: 5,
            serversOwned: 2,
            serversBanned: 0,
            createdDateTime: new Date(),
            deleteDate: null
        };

        (userService.unbanUser as jest.Mock).mockResolvedValue(undefined);
        (questionService.unbanUserBannedQuestions as jest.Mock).mockResolvedValue(3);
        (serverService.unbanUserServers as jest.Mock).mockResolvedValue(2);
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });

        await unbanUserButton.execute(botInteraction);

        expect(userService.unbanUser).toHaveBeenCalledWith('123456789');
        expect(questionService.unbanUserBannedQuestions).toHaveBeenCalledWith('123456789');
        expect(serverService.unbanUserServers).toHaveBeenCalledWith('123456789');
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
        (userService.unbanUser as jest.Mock).mockResolvedValue(undefined);
        (questionService.unbanUserBannedQuestions as jest.Mock).mockResolvedValue(3);
        (serverService.unbanUserServers as jest.Mock).mockResolvedValue(2);
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(null);

        await unbanUserButton.execute(botInteraction);

        expect(userService.unbanUser).toHaveBeenCalledWith('123456789');
        expect(questionService.unbanUserBannedQuestions).toHaveBeenCalledWith('123456789');
        expect(serverService.unbanUserServers).toHaveBeenCalledWith('123456789');
        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(userProfileView).not.toHaveBeenCalled();
    });
});
