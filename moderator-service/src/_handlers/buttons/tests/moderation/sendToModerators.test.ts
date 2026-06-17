import { BotButtonInteraction } from '@vulps22/bot-interactions';
import sendToModeratorsButton from '../../moderation/sendToModerators';

jest.mock('../../../../bot/builders/UserProfileBuilder', () => ({
    UserProfileBuilder: jest.fn().mockImplementation(() => ({
        getUserProfile: jest.fn(),
    })),
}));

jest.mock('../../../../views', () => ({
    userProfileView: jest.fn(),
}));

jest.mock('../../../../bot/config', () => ({
    Config: {
        MOD_CHAT_CHANNEL_ID: 'mod-chat-channel-id',
    },
}));

import { UserProfileBuilder } from '../../../../bot/builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';

describe('sendToModerators button handler', () => {
    let mockInteraction: jest.Mocked<BotButtonInteraction>;
    let mockGetUserProfile: jest.Mock;
    let mockChannelFetch: jest.Mock;
    let mockChannelSend: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetUserProfile = jest.fn();
        (UserProfileBuilder as jest.Mock).mockImplementation(() => ({
            getUserProfile: mockGetUserProfile,
        }));

        mockChannelSend = jest.fn().mockResolvedValue({
            id: 'msg-999',
        });

        mockChannelFetch = jest.fn().mockResolvedValue({
            isTextBased: () => true,
            send: mockChannelSend,
            id: 'mod-chat-channel-id',
            guildId: '987654321',
        });

        mockInteraction = {
            params: new Map([['id', 'user-123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
            client: {
                channels: {
                    fetch: mockChannelFetch,
                },
            },
        } as unknown as jest.Mocked<BotButtonInteraction>;
    });

    it('should have correct handler properties', () => {
        expect(sendToModeratorsButton.name).toBe('sendToModerators');
        expect(sendToModeratorsButton.params).toEqual({ ID: 'id' });
    });

    it('should send error view and throw when userId is missing', async () => {
        (mockInteraction as any).params = new Map();

        await expect(sendToModeratorsButton.execute(mockInteraction)).rejects.toThrow(
            'Invalid user ID when using Button: moderation_sendToModerators'
        );

        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should send error view when user profile not found', async () => {
        mockGetUserProfile.mockResolvedValue(null);

        await sendToModeratorsButton.execute(mockInteraction);

        expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
        expect(mockChannelFetch).not.toHaveBeenCalled();
    });

    it('should send error view and throw when mod chat channel not found', async () => {
        const mockProfile = { userId: 'user-123', username: 'testuser' };
        const mockView = { embeds: [], components: [] };

        mockGetUserProfile.mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue(mockView);
        mockChannelFetch.mockResolvedValue(null);

        await expect(sendToModeratorsButton.execute(mockInteraction)).rejects.toThrow(
            'Mod chat channel not found when using Button: moderation_sendToModerators'
        );

        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should send error view and throw when channel is not text-based', async () => {
        const mockProfile = { userId: 'user-123', username: 'testuser' };
        const mockView = { embeds: [], components: [] };

        mockGetUserProfile.mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue(mockView);
        mockChannelFetch.mockResolvedValue({
            isTextBased: () => false,
            id: 'voice-channel-id',
        });

        await expect(sendToModeratorsButton.execute(mockInteraction)).rejects.toThrow(
            'Mod chat channel not found when using Button: moderation_sendToModerators'
        );

        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should send profile to mod chat and reply with success link', async () => {
        const mockProfile = { userId: 'user-123', username: 'testuser' };
        const mockView = { embeds: [], components: [] };

        mockGetUserProfile.mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue(mockView);

        await sendToModeratorsButton.execute(mockInteraction);

        expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockChannelFetch).toHaveBeenCalledWith('mod-chat-channel-id');
        expect(mockChannelSend).toHaveBeenCalledWith(mockView);
        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });
});
