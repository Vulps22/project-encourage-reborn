import { BotButtonInteraction } from '@vulps22/bot-interactions';
import showUserButton from '../../moderation/showUser';

jest.mock('../../../../bot/builders/UserProfileBuilder', () => ({
    UserProfileBuilder: jest.fn().mockImplementation(() => ({
        getUserProfile: jest.fn(),
    })),
}));

jest.mock('../../../../views', () => ({
    userProfileView: jest.fn(),
}));

import { UserProfileBuilder } from '../../../../bot/builders/UserProfileBuilder';
import { userProfileView } from '../../../../views';

describe('showUser button handler', () => {
    let mockInteraction: jest.Mocked<BotButtonInteraction>;
    let mockGetUserProfile: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetUserProfile = jest.fn();
        (UserProfileBuilder as jest.Mock).mockImplementation(() => ({
            getUserProfile: mockGetUserProfile,
        }));

        mockInteraction = {
            params: new Map([['id', 'user-123']]),
            ephemeralReply: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<BotButtonInteraction>;
    });

    it('should have correct handler properties', () => {
        expect(showUserButton.name).toBe('showUser');
        expect(showUserButton.interactionInitiator).toBe(true);
        expect(showUserButton.params).toEqual({ ID: 'id' });
    });

    it('should send error view when userId is missing', async () => {
        (mockInteraction as any).params = new Map();

        await expect(showUserButton.execute(mockInteraction)).rejects.toThrow(
            'Invalid user ID when using Button: moderator_showUser'
        );

        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should send error view when user profile not found', async () => {
        mockGetUserProfile.mockResolvedValue(null);

        await showUserButton.execute(mockInteraction);

        expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: expect.any(Number) })
        );
    });

    it('should send user profile view on success', async () => {
        const mockProfile = { userId: 'user-123', username: 'testuser' };
        const mockView = { embeds: [], components: [] };

        mockGetUserProfile.mockResolvedValue(mockProfile);
        (userProfileView as jest.Mock).mockResolvedValue(mockView);

        await showUserButton.execute(mockInteraction);

        expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
        expect(userProfileView).toHaveBeenCalledWith(mockProfile);
        expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith(mockView);
    });
});
