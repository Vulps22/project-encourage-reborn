import { ButtonInteraction } from 'discord.js';
import { BotButtonInteraction } from '@vulps22/bot-interactions';
import banUserButton from '../../moderation/banUser';
import { moderationService } from '../../../../services';
import { UserProfileBuilder } from '../../../../bot/builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';
import { TargetType } from '@vulps22/project-encourage-types';

jest.mock('../../../../services');
jest.mock('../../../../bot/builders/UserProfileBuilder');
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
        expect(banUserButton.name).toBe('banUser');
        expect(banUserButton.params).toEqual({ 'ID': 'id' });
    });

    it('should show ban reasons dropdown', async () => {
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

        const mockReasons = [
            { label: 'Spam', value: 'spam' },
            { label: 'Under 18', value: 'under_18' }
        ];

        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (moderationService.getBanReasons as jest.Mock).mockReturnValue(mockReasons);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });

        await banUserButton.execute(botInteraction);

        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(moderationService.getBanReasons).toHaveBeenCalledWith(TargetType.User);
        expect(userProfileView).toHaveBeenCalledWith(mockProfile, mockReasons);
        expect(mockInteraction.update).toHaveBeenCalled();
    });

    it('should revert to button view on 60s timeout', async () => {
        const mockProfile = { id: '123456789', isBanned: false };
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (moderationService.getBanReasons as jest.Mock).mockReturnValue([]);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });
        mockInteraction.message.awaitMessageComponent = jest.fn().mockRejectedValue(new Error('timeout'));

        await banUserButton.execute(botInteraction);
        await new Promise(resolve => setImmediate(resolve));

        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.message.edit).toHaveBeenCalled();
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

    it('should handle user not found', async () => {
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(null);

        await banUserButton.execute(botInteraction);

        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(moderationService.getBanReasons).not.toHaveBeenCalled();
        expect(userProfileView).not.toHaveBeenCalled();
    });
});
