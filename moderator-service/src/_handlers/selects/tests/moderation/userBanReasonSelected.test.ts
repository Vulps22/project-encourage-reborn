import { StringSelectMenuInteraction } from 'discord.js';
import { BotSelectMenuInteraction } from '@vulps22/bot-interactions';
import userBanReasonSelected from '../../moderation/userBanReasonSelected';
import { moderationService, questionService, reportService, serverService, userService } from '../../../../services';
import { UserProfileBuilder } from '../../../../bot/builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';
import { Logger } from '../../../../bot/utils';

jest.mock('../../../../services');
jest.mock('../../../../bot/builders/UserProfileBuilder');
jest.mock('../../../../views');
jest.mock('../../../../bot/utils');

describe('userBanReasonSelected', () => {
    let mockInteraction: any;
    let botInteraction: BotSelectMenuInteraction;

    beforeEach(() => {
        jest.clearAllMocks();

        (moderationService.findActioningReports as jest.Mock).mockResolvedValue([]);
        (moderationService.actionedReport as jest.Mock).mockResolvedValue(undefined);
        (reportService.notifyReporter as jest.Mock).mockResolvedValue(undefined);

        mockInteraction = {
            customId: 'moderation_userBanReasonSelected_id:123456789',
            user: { id: '999888777666555444' },
            values: ['Spam'],
            deferred: false,
            replied: false,
            reply: jest.fn().mockResolvedValue(undefined),
            editReply: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
        };

        botInteraction = new BotSelectMenuInteraction(
            mockInteraction as StringSelectMenuInteraction,
            'exec-123'
        );
    });

    it('should have correct name and params', () => {
        expect(userBanReasonSelected.name).toBe('userBanReasonSelected');
        expect(userBanReasonSelected.params).toEqual({ 'ID': 'id' });
    });

    it('should ban user, questions, and servers then refresh profile', async () => {
        const mockProfile = {
            id: '123456789',
            isBanned: true,
            banReason: 'Spam',
            rulesAccepted: true,
            globalLevel: 1,
            globalXP: 100,
            totalQuestions: 10,
            approvedQuestions: 5,
            bannedQuestions: 5,
            totalServers: 3,
            serversOwned: 2,
            serversBanned: 2,
            createdDateTime: new Date(),
            deleteDate: null
        };

        (userService.banUser as jest.Mock).mockResolvedValue(undefined);
        (questionService.banAllUserQuestions as jest.Mock).mockResolvedValue(5);
        (serverService.banUserServers as jest.Mock).mockResolvedValue(2);
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });

        await userBanReasonSelected.execute(botInteraction);

        expect(userService.banUser).toHaveBeenCalledWith('123456789', 'Spam');
        expect(questionService.banAllUserQuestions).toHaveBeenCalledWith('123456789', '999888777666555444');
        expect(serverService.banUserServers).toHaveBeenCalledWith('123456789', 'Spam');
        expect(UserProfileBuilder.prototype.getUserProfile).toHaveBeenCalledWith('123456789');
        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.update).toHaveBeenCalled();
    });

    it('should handle missing user ID', async () => {
        mockInteraction.customId = 'moderation_userBanReasonSelected';
        botInteraction = new BotSelectMenuInteraction(
            mockInteraction as StringSelectMenuInteraction,
            'exec-123'
        );

        await userBanReasonSelected.execute(botInteraction);

        expect(Logger.error).toHaveBeenCalledWith('User ID not found when executing userBanReasonSelected');
        expect(userService.banUser).not.toHaveBeenCalled();
    });

    it('should handle missing reason', async () => {
        mockInteraction.values = [];
        botInteraction = new BotSelectMenuInteraction(
            mockInteraction as StringSelectMenuInteraction,
            'exec-123'
        );

        await userBanReasonSelected.execute(botInteraction);

        expect(userService.banUser).not.toHaveBeenCalled();
    });

    it('should handle user not found after banning', async () => {
        (userService.banUser as jest.Mock).mockResolvedValue(undefined);
        (questionService.banAllUserQuestions as jest.Mock).mockResolvedValue(5);
        (serverService.banUserServers as jest.Mock).mockResolvedValue(2);
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(null);

        await userBanReasonSelected.execute(botInteraction);

        expect(userService.banUser).toHaveBeenCalled();
        expect(questionService.banAllUserQuestions).toHaveBeenCalled();
        expect(serverService.banUserServers).toHaveBeenCalled();
        expect(Logger.error).toHaveBeenCalledWith('User 123456789 not found after banning');
        expect(userProfileView).not.toHaveBeenCalled();
    });

    it('should handle errors during ban process', async () => {
        (userService.banUser as jest.Mock).mockRejectedValue(new Error('Database error'));

        await userBanReasonSelected.execute(botInteraction);

        expect(Logger.error).toHaveBeenCalledWith('Error banning user 123456789: Database error');
    });

    it('should notify all reporters when multiple ACTIONING reports exist', async () => {
        const mockReports = [
            { id: 30, sender_id: 'reporter-1' },
            { id: 31, sender_id: 'reporter-2' },
        ];
        const mockProfile = { id: '123456789', isBanned: true };

        (userService.banUser as jest.Mock).mockResolvedValue(undefined);
        (questionService.banAllUserQuestions as jest.Mock).mockResolvedValue(0);
        (serverService.banUserServers as jest.Mock).mockResolvedValue(0);
        (UserProfileBuilder.prototype.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue({ components: [] });
        (moderationService.findActioningReports as jest.Mock).mockResolvedValue(mockReports);

        await userBanReasonSelected.execute(botInteraction);

        expect(moderationService.actionedReport).toHaveBeenCalledTimes(2);
        expect(moderationService.actionedReport).toHaveBeenCalledWith(30, '999888777666555444');
        expect(moderationService.actionedReport).toHaveBeenCalledWith(31, '999888777666555444');
        expect(reportService.notifyReporter).toHaveBeenCalledTimes(2);
    });
});
